import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { Input, Textarea } from "../../components/ui/Field";
import { formatDate, fullName, ordinal } from "../../utils/format";

const Item = ({ label, value }) => (
  <div className="border-b border-slate-100 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="mt-0.5 text-sm sm:col-span-2 sm:mt-0">{value || "—"}</dd>
  </div>
);

function detailsFor(role, u) {
  if (role === "student") {
    return [
      ["Enrollment number", u.enrollmentNo],
      ["Programme", u.branch?.name],
      ["Semester / Section", `${ordinal(u.semester)} semester, section ${u.section}`],
      ["Admission year", u.admissionYear],
      ["Email", u.email],
      ["Gender", u.gender],
      ["Date of birth", u.dob && formatDate(u.dob)],
      ["Blood group", u.bloodGroup],
      ["Guardian", u.guardianName && `${u.guardianName}${u.guardianPhone ? ` (${u.guardianPhone})` : ""}`],
    ];
  }
  if (role === "faculty") {
    return [
      ["Employee ID", u.employeeId],
      ["Department", u.department?.name],
      ["Designation", u.designation],
      ["Qualification", u.qualification],
      ["Experience", `${u.experience || 0} years`],
      ["Joined on", formatDate(u.joiningDate)],
      ["Email", u.email],
      ["Gender", u.gender],
    ];
  }
  return [
    ["Employee ID", u.employeeId],
    ["Designation", u.designation],
    ["Email", u.email],
    ["Account type", u.isSuperAdmin ? "Super admin" : "Admin"],
  ];
}

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const fileRef = useRef();
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [name, setName] = useState(user.name || "");
  const [busy, setBusy] = useState(false);

  const save = async (fields) => {
    setBusy(true);
    try {
      const body = new FormData();
      Object.entries(fields).forEach(([k, v]) => body.append(k, v));
      const { data } = await api.put("/auth/profile", body);
      setUser(data.user);
      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = (e) => {
    const file = e.target.files[0];
    if (file) save({ profileImage: file });
    e.target.value = "";
  };

  const submit = (e) => {
    e.preventDefault();
    save(role === "admin" ? { name, phone } : { phone, address });
  };

  return (
    <>
      <PageHeader title="My profile" description="Academic details are maintained by the administration. You can update your contact details." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center overflow-hidden p-6 pt-0 text-center">
          <div className="-mx-6 mb-[-56px] h-28 w-[calc(100%+3rem)] bg-gradient-to-br from-navy-900 via-navy-700 to-brand-600" />
          <div className="relative">
            <Avatar src={user.profileImage} name={fullName(user)} size="xl" />
            <button
              className="absolute bottom-0 right-0 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:text-brand-700"
              onClick={() => fileRef.current.click()}
              disabled={busy}
              title="Change photo"
            >
              <Camera size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{fullName(user)}</h2>
          <p className="text-sm text-slate-500">
            {role === "student" ? user.enrollmentNo : user.designation}
          </p>
          <div className="mt-3">
            <Badge tone="brand">{role === "student" ? `${user.branch?.code} · Sem ${user.semester}` : role === "faculty" ? user.department?.code : "Administration"}</Badge>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold">Details</h3>
          <dl className="mt-2">
            {detailsFor(role, user).map(([label, value]) => (
              <Item key={label} label={label} value={value} />
            ))}
          </dl>

          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <h3 className="font-semibold sm:col-span-2">Contact information</h3>
            {role === "admin" && <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />}
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
            {role !== "admin" && (
              <Textarea label="Address" className="sm:col-span-2" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            )}
            <div className="sm:col-span-2">
              <button className="btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Update details"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
