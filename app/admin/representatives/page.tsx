"use client";

// app/admin/representatives/page.tsx
//
// This is the actual bottleneck page for the whole platform right now:
// mayors, city councils, county board seats, and school boards have no
// free API source (see ARCHITECTURE.md), so this form is how they get
// entered — by hand, one at a time, by an admin or moderator.

import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { OfficeLevel, Representative } from "@/types/civic";

const OFFICE_LEVELS: { value: OfficeLevel; label: string }[] = [
  { value: "mayor", label: "Mayor" },
  { value: "city_council", label: "City Council" },
  { value: "county_board", label: "County Board" },
  { value: "school_board", label: "School Board" },
  { value: "township", label: "Township" },
  { value: "state_house", label: "State House" },
  { value: "state_senate", label: "State Senate" },
  { value: "federal_house", label: "U.S. House" },
  { value: "federal_senate", label: "U.S. Senate" },
  { value: "governor", label: "Governor" },
  { value: "judicial", label: "Judicial" },
  { value: "other_local", label: "Other Local" },
];

const emptyForm = {
  fullName: "",
  officeLevel: "city_council" as OfficeLevel,
  officeTitle: "",
  cityFips: "",
  countyFips: "",
  phone: "",
  email: "",
  officialWebsite: "",
};

export default function AdminRepresentativesPage() {
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function loadReps() {
    setLoading(true);
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(query(collection(db, "representatives"), orderBy("fullName")));
    setReps(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Representative)));
    setLoading(false);
  }

  useEffect(() => {
    loadReps();
  }, []);

  function buildRepData(f: typeof emptyForm): Record<string, unknown> {
    const data: Record<string, unknown> = {
      fullName: f.fullName.trim(),
      officeLevel: f.officeLevel,
      officeTitle: f.officeTitle.trim(),
      dataSource: "manual_curation",
      lastVerifiedAt: new Date().toISOString(),
    };
    if (f.cityFips.trim()) data.cityFips = f.cityFips.trim();
    if (f.countyFips.trim()) data.countyFips = f.countyFips.trim();
    if (f.officialWebsite.trim()) data.officialWebsite = f.officialWebsite.trim();
    if (f.phone.trim() || f.email.trim()) {
      data.contact = {
        ...(f.phone.trim() && { phone: f.phone.trim() }),
        ...(f.email.trim() && { email: f.email.trim() }),
      };
    }
    return data;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim() || !form.officeTitle.trim()) {
      setError("Name and office title are required.");
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore(firebaseApp);
      await addDoc(collection(db, "representatives"), buildRepData(form));
      setForm(emptyForm);
      await loadReps();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save this representative.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this representative?")) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "representatives", id));
    await loadReps();
  }

  function startEdit(rep: Representative) {
    setEditingId(rep.id);
    setEditForm({
      fullName: rep.fullName,
      officeLevel: rep.officeLevel,
      officeTitle: rep.officeTitle,
      cityFips: rep.cityFips ?? "",
      countyFips: rep.countyFips ?? "",
      phone: rep.contact?.phone ?? "",
      email: rep.contact?.email ?? "",
      officialWebsite: rep.officialWebsite ?? "",
    });
  }

  async function saveEdit(id: string) {
    const db = getFirestore(firebaseApp);
    await updateDoc(doc(db, "representatives", id), buildRepData(editForm));
    setEditingId(null);
    await loadReps();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Representatives</h1>
      <p className="text-white/50 mt-1">
        Local offices (mayor, city council, county board, school board) have
        no free data source — add them here one at a time. State and
        federal legislators are resolved automatically and don't need to be
        entered manually.
      </p>

      <form onSubmit={handleAdd} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <h2 className="font-medium">Add a representative</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
          <Field label="Office level">
            <select
              value={form.officeLevel}
              onChange={(e) => setForm({ ...form, officeLevel: e.target.value as OfficeLevel })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            >
              {OFFICE_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Office title (e.g. 'Mayor', 'Ward 3 Alderman')">
            <input
              value={form.officeTitle}
              onChange={(e) => setForm({ ...form, officeTitle: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
          <Field label="City FIPS code (for city/local offices)">
            <input
              value={form.cityFips}
              onChange={(e) => setForm({ ...form, cityFips: e.target.value })}
              placeholder="e.g. 1725274 for Fairview Heights"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
          <Field label="County FIPS code (for county-wide offices)">
            <input
              value={form.countyFips}
              onChange={(e) => setForm({ ...form, countyFips: e.target.value })}
              placeholder="17163 for St. Clair County"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
          <Field label="Official website">
            <input
              value={form.officialWebsite}
              onChange={(e) => setForm({ ...form, officialWebsite: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
          <Field label="Email">
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </Field>
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-2.5
                     hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Add representative"}
        </button>
      </form>

      <h2 className="mt-10 font-medium">
        {loading ? "Loading…" : `${reps.length} representatives on file`}
      </h2>
      <div className="mt-4 space-y-2">
        {reps.map((rep) => (
          <div
            key={rep.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            {editingId === rep.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Full name"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <select
                  value={editForm.officeLevel}
                  onChange={(e) => setEditForm({ ...editForm, officeLevel: e.target.value as OfficeLevel })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                >
                  {OFFICE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                  value={editForm.officeTitle}
                  onChange={(e) => setEditForm({ ...editForm, officeTitle: e.target.value })}
                  placeholder="Office title"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  value={editForm.cityFips}
                  onChange={(e) => setEditForm({ ...editForm, cityFips: e.target.value })}
                  placeholder="City FIPS"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  value={editForm.countyFips}
                  onChange={(e) => setEditForm({ ...editForm, countyFips: e.target.value })}
                  placeholder="County FIPS"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  value={editForm.officialWebsite}
                  onChange={(e) => setEditForm({ ...editForm, officialWebsite: e.target.value })}
                  placeholder="Official website"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(rep.id)} className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] px-3 py-1.5">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm rounded-lg border border-white/15 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{rep.fullName}</p>
                  <p className="text-sm text-white/50">
                    {rep.officeTitle} · {rep.dataSource === "manual_curation" ? "manually entered" : rep.dataSource}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => startEdit(rep)} className="text-sm text-[#00E5C3]/80 hover:text-[#00E5C3]">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(rep.id)} className="text-sm text-red-300/70 hover:text-red-300">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
