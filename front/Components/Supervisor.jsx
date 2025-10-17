// Components/Supervisor.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { AuthContext } from "../App";          // ⬅️ read user from context
import { getApiBase } from "../lib/apiBase";   // ⬅️ keep API base consistent
const API_BASE = getApiBase();

// Small UI helpers (kept at bottom in your version)
function Pill({ label, bg, fg }) {
  return (
    <View style={{ 
      backgroundColor: bg, 
      paddingVertical: 6, 
      paddingHorizontal: 10, 
      borderRadius: 999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    }}>
      <Text style={{ 
        color: fg, 
        fontWeight: "700", 
        fontSize: 13,
        letterSpacing: 0.2,
      }}>{label}</Text>
    </View>
  );
}
function SmallBtn({ title, onPress, tone = "gray", disabled }) {
  const map = {
    blue: { bg: "#2563eb", fg: "#fff" },
    green: { bg: "#16a34a", fg: "#fff" },
    gray: { bg: "#fff", fg: "#111827", border: "#d1d5db" },
    purple: { bg: "#7c3aed", fg: "#fff" },
  };
  const c = map[tone] || map.gray;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: disabled ? "#e5e7eb" : c.bg,
          borderWidth: c.border ? 1 : 0,
          borderColor: c.border || "transparent",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1,
        },
      ]}
    >
      <Text style={{ 
        color: disabled ? "#9ca3af" : c.fg, 
        fontWeight: "700", 
        fontSize: 14,
        letterSpacing: 0.2,
      }}>{title}</Text>
    </Pressable>
  );
}
function Primary({ title, onPress, tone = "blue" }) {
  const map = { blue: "#2563eb", green: "#16a34a", purple: "#7c3aed" };
  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.primaryBtn, 
        { backgroundColor: map[tone] || "#2563eb" }
      ]}
    >
      <Text style={styles.primaryBtnText}>{title}</Text>
    </Pressable>
  );
}
function LabeledInput({ label, style, ...props }) {
  return (
    <View style={[{ gap: 8 }, style]}>
      <Text style={{ 
        fontSize: 14, 
        color: "#374151", 
        fontWeight: "600",
        letterSpacing: 0.2,
      }}>{label}</Text>
      <TextInput
        placeholderTextColor="#9CA3AF"
        style={{
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === "ios" ? 12 : 10,
          color: "#111827",
          fontSize: 15,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
        }}
        {...props}
      />
    </View>
  );
}
function Stat({ label, value, color = "#111827" }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ 
        color: "#6b7280", 
        fontSize: 13,
        letterSpacing: 0.2,
      }}>{label}</Text>
      <Text style={{ 
        color, 
        fontWeight: "700",
        fontSize: 15,
      }}>{String(value ?? "-")}</Text>
    </View>
  );
}
function MetricCard({ label, value, bg, fg }) {
  return (
    <View style={[styles.metric, { backgroundColor: bg, borderColor: bg }]}>
      <Text style={[styles.metricValue, { color: fg }]}>{value ?? "-"}</Text>
      <Text style={[styles.metricLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}
function InfoCard({ title, rows }) {
  return (
    <View style={styles.card}>
      <Text style={styles.subTitle}>{title}</Text>
      <View style={{ marginTop: 10, gap: 10 }}>
        {rows.map(([l, v]) => (
          <View key={l} style={{ 
            flexDirection: "row", 
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Text style={styles.muted}>{l}</Text>
            <Text style={{ 
              fontWeight: "700",
              fontSize: 15,
            }}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SupervisorDashboard() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);     // ⬅️ use context instead of prop

  // Optional hard-redirect if somehow mounted while logged-out
  useEffect(() => {
    if (!user) navigation.replace("SignIn");
  }, [user, navigation]);

  const [activeTab, setActiveTab] = useState("overview");
  const [alerts, setAlerts] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [metrics, setMetrics] = useState({});

  // Last 20 (merged table)
  const [last20, setLast20] = useState([]);
  const [last20Loading, setLast20Loading] = useState(true);
  const [last20Error, setLast20Error] = useState("");

  // Post-delivery paginated
  const [postDeliveries, setPostDeliveries] = useState([]);
  const [pdLoading, setPdLoading] = useState(false);
  const [pdError, setPdError] = useState("");
  const [pdPage, setPdPage] = useState(1);
  const pdPageSize = 25;
  const [pdTotal, setPdTotal] = useState(0);

  // Add Worker modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    area: "",
    status: "active",
    deviceStatus: "online",
    patientsToday: "0",
    highRiskCases: "0",
  });
  const [addError, setAddError] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    loadSupervisorData();
    loadLast20();
  }, []);

  useEffect(() => {
    if (activeTab === "postdeliveries") {
      fetchPostDeliveries(pdPage, pdPageSize);
    }
  }, [activeTab, pdPage]);

  async function getToken() {
    return (await AsyncStorage.getItem("token")) || "";
  }

  async function loadSupervisorData() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/supervisor/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setFieldWorkers(data.fieldWorkers || []);
        setMetrics(data.metrics || {});
        return;
      }
    } catch {
      // fall through to mock
    }
    // Fallback mock
    setAlerts([
      {
        id: 1,
        type: "high-risk",
        patient: "Patient #1234",
        fieldWorker: "Priya Sharma",
        message: "Severe hypertension detected (180/110)",
        timestamp: "2024-01-20T10:30:00Z",
        status: "pending",
      },
      {
        id: 2,
        type: "referral",
        patient: "Patient #1235",
        fieldWorker: "Anjali Patel",
        message: "Urgent referral needed for gestational diabetes",
        timestamp: "2024-01-20T09:15:00Z",
        status: "acknowledged",
      },
      {
        id: 3,
        type: "system",
        patient: null,
        fieldWorker: "Meera Singh",
        message: "Device offline for 48+ hours",
        timestamp: "2024-01-19T16:00:00Z",
        status: "pending",
      },
    ]);
    setFieldWorkers([
      {
        id: 1,
        name: "Priya Sharma",
        area: "Sector 12, Noida",
        status: "active",
        lastSync: "2024-01-20T11:00:00Z",
        patientsToday: 8,
        highRiskCases: 2,
        deviceStatus: "online",
      },
      {
        id: 2,
        name: "Anjali Patel",
        area: "Gurgaon Village",
        status: "active",
        lastSync: "2024-01-20T10:45:00Z",
        patientsToday: 6,
        highRiskCases: 1,
        deviceStatus: "online",
      },
      {
        id: 3,
        name: "Meera Singh",
        area: "Faridabad Rural",
        status: "offline",
        lastSync: "2024-01-18T14:30:00Z",
        patientsToday: 0,
        highRiskCases: 0,
        deviceStatus: "offline",
      },
    ]);
    setMetrics({
      totalScreenings: 156,
      highRiskCases: 23,
      referralsMade: 18,
      followUpsDue: 34,
      activeFieldWorkers: 12,
      offlineDevices: 2,
    });
  }

  async function loadLast20() {
    setLast20Loading(true);
    setLast20Error("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/dashboard/last20`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLast20(json.data || []);
    } catch (err) {
      setLast20([]);
      setLast20Error(err.message || "Failed to load data");
    } finally {
      setLast20Loading(false);
    }
  }

  async function markSurveyed(id) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/dashboard/survey/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        setLast20((prev) => prev.map((row) => (row.id === id ? { ...row, surveyed: true } : row)));
      }
    } catch {}
  }

  function resetAddForm() {
    setAddForm({
      name: "",
      area: "",
      status: "active",
      deviceStatus: "online",
      patientsToday: "0",
      highRiskCases: "0",
    });
    setAddError("");
  }

  function validateAddForm() {
    if (!addForm.name.trim()) return "Name is required";
    if (!addForm.area.trim()) return "Area is required";
    if (!["active", "inactive", "offline"].includes(addForm.status)) return "Invalid status";
    if (!["online", "offline"].includes(addForm.deviceStatus)) return "Invalid device status";
    if (isNaN(Number(addForm.patientsToday)) || Number(addForm.patientsToday) < 0)
      return "Patients Today must be 0 or more";
    if (isNaN(Number(addForm.highRiskCases)) || Number(addForm.highRiskCases) < 0)
      return "High Risk Cases must be 0 or more";
    return null;
  }

  async function submitAddWorker() {
    setAddError("");
    const v = validateAddForm();
    if (v) {
      setAddError(v);
      return;
    }
    const payload = {
      name: addForm.name.trim(),
      area: addForm.area.trim(),
      status: addForm.status,
      deviceStatus: addForm.deviceStatus,
      patientsToday: Number(addForm.patientsToday),
      highRiskCases: Number(addForm.highRiskCases),
    };
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, lastSync: new Date().toISOString(), ...payload };
    setAddSubmitting(true);
    setFieldWorkers((prev) => [optimistic, ...prev]);
    setShowAddModal(false);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/supervisor/fieldworkers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setFieldWorkers((prev) => prev.filter((w) => w.id !== tempId));
        setAddError(`Server error: ${res.status} ${res.statusText || ""}`);
        return;
      }
      const created = await res.json();
      setFieldWorkers((prev) =>
        prev.map((w) => (w.id === tempId ? { ...created, lastSync: created.lastSync || new Date().toISOString() } : w))
      );
      resetAddForm();
    } catch (err) {
      setFieldWorkers((prev) => prev.filter((w) => w.id !== tempId));
      setAddError(err.message || "Failed to add worker");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function fetchPostDeliveries(page = 1, pageSize = 25) {
    setPdLoading(true);
    setPdError("");
    try {
      const token = await getToken();
      const offset = (page - 1) * pageSize;
      const url = `${API_BASE}/post-delivery?limit=${pageSize}&offset=${offset}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setPostDeliveries(json.data || []);
      setPdTotal(Number(json.total || 0));
    } catch (err) {
      setPostDeliveries([]);
      setPdError(err.message || "Failed to load post-deliveries");
    } finally {
      setPdLoading(false);
    }
  }

  const tabs = useMemo(
    () => [
      { id: "overview", title: "Overview", icon: "📊" },
      { id: "alerts", title: "Alerts", icon: "🚨" },
      { id: "fieldworkers", title: "Field Workers", icon: "👩‍⚕️" },
      { id: "reports", title: "Reports", icon: "📈" },
      { id: "postdeliveries", title: "Post-Delivery", icon: "🤱" },
      { id: "settings", title: "Settings", icon: "⚙️" },
    ],
    []
  );

  const last20HeaderCols = [
    "ID","Name","Age","Past Pregnancies","Mother BG","Father BG",
    "Mother Medical BG","Father Medical BG","Delivery Type","Haemoglobin",
    "Created At","Reminder Date","Surveyed",
  ];

  const getStatusColors = (status) => {
    if (status === "active") return { bg: "#dcfce7", fg: "#166534" };
    if (status === "offline") return { bg: "#fee2e2", fg: "#991b1b" };
    if (status === "pending") return { bg: "#fef9c3", fg: "#854d0e" };
    return { bg: "#e5e7eb", fg: "#374151" };
  };
  const getDeviceColors = (s) =>
    s === "online" ? { bg: "#dcfce7", fg: "#166534" } : { bg: "#fee2e2", fg: "#991b1b" };
  const alertTypeColors = (type) => {
    if (type === "high-risk") return { bg: "#fee2e2", fg: "#b91c1c", border: "#fca5a5" };
    if (type === "referral") return { bg: "#ffedd5", fg: "#9a3412", border: "#fdba74" };
    return { bg: "#dbeafe", fg: "#1e3a8a", border: "#93c5fd" };
  };

  /* -------------------- Tab content components -------------------- */

  const Overview = () => (
    <View style={{ gap: 16 }}>
      <View style={styles.metricsGrid}>
        <MetricCard label="Total Screenings" value={metrics.totalScreenings} bg="#dbeafe" fg="#1d4ed8" />
        <MetricCard label="High Risk Cases" value={metrics.highRiskCases} bg="#fee2e2" fg="#b91c1c" />
        <MetricCard label="Referrals Made" value={metrics.referralsMade} bg="#ffedd5" fg="#c2410c" />
        <MetricCard label="Follow-ups Due" value={metrics.followUpsDue} bg="#fef9c3" fg="#a16207" />
        <MetricCard label="Active Workers" value={metrics.activeFieldWorkers} bg="#dcfce7" fg="#15803d" />
        <MetricCard label="Offline Devices" value={metrics.offlineDevices} bg="#e5e7eb" fg="#374151" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Alerts</Text>
        <View style={{ gap: 10 }}>
          {alerts.slice(0, 3).map((a) => {
            const c = alertTypeColors(a.type);
            return (
              <View key={a.id} style={[styles.alertRow, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertMsg]}>{a.message}</Text>
                  <Text style={styles.muted}>
                    {a.patient ? `${a.patient} • ` : ""}
                    Field Worker: {a.fieldWorker}
                  </Text>
                </View>
                <Text style={styles.mutedSmall}>
                  {new Date(a.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const AlertsTab = () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pill label={`High Risk (${alerts.filter((a) => a.type === "high-risk").length})`} bg="#fee2e2" fg="#b91c1c" />
        <Pill label={`Referrals (${alerts.filter((a) => a.type === "referral").length})`} bg="#ffedd5" fg="#9a3412" />
        <Pill label={`System (${alerts.filter((a) => a.type === "system").length})`} bg="#dbeafe" fg="#1e3a8a" />
      </View>
      <View style={{ gap: 10 }}>
        {alerts.map((a) => {
          const typeC = alertTypeColors(a.type);
          const statusC = getStatusColors(a.status);
          return (
            <View key={a.id} style={styles.card}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Pill label={a.type.toUpperCase()} bg={typeC.bg} fg={typeC.fg} />
                <Pill label={a.status.toUpperCase()} bg={statusC.bg} fg={statusC.fg} />
              </View>
              <Text style={styles.alertMsg}>{a.message}</Text>
              <Text style={styles.muted}>
                {a.patient ? `Patient: ${a.patient} • ` : ""}
                Field Worker: {a.fieldWorker} • {new Date(a.timestamp).toLocaleString()}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <SmallBtn title="Review" tone="blue" onPress={() => {}} />
                <SmallBtn title="Resolve" tone="green" onPress={() => {}} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const FieldWorkersTab = () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.cardTitle}>Field Worker Status</Text>
        <Pressable style={styles.primaryBtn} onPress={() => { resetAddForm(); setShowAddModal(true); }}>
          <Text style={styles.primaryBtnText}>Add New Worker</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        {fieldWorkers.map((w) => {
          const statusC = getStatusColors(w.status);
          const devC = getDeviceColors(w.deviceStatus);
          return (
            <View key={w.id} style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    <Pill label={w.status.toUpperCase()} bg={statusC.bg} fg={statusC.fg} />
                    <Pill label={w.deviceStatus.toUpperCase()} bg={devC.bg} fg={devC.fg} />
                  </View>
                  <Text style={styles.muted}>Area: {w.area}</Text>
                  <View style={styles.statsRow}>
                    <Stat label="Patients Today" value={w.patientsToday} />
                    <Stat label="High Risk" value={w.highRiskCases} color="#b91c1c" />
                    <Stat
                      label="Last Sync"
                      value={w.lastSync ? new Date(w.lastSync).toLocaleTimeString() : "-"}
                    />
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <SmallBtn title="Contact" tone="blue" onPress={() => {}} />
                  <SmallBtn title="View Cases" tone="green" onPress={() => {}} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const ReportsTab = () => (
    <View style={{ gap: 16 }}>
      <Text style={styles.cardTitle}>System Reports</Text>

      <View style={styles.grid2}>
        <InfoCard
          title="Performance Metrics"
          rows={[
            ["Screening Completion Rate", "94%"],
            ["High-Risk Detection Rate", "15%"],
            ["Referral Follow-up Rate", "87%"],
            ["Data Sync Success Rate", "98%"],
          ]}
        />
        <InfoCard
          title="Government Integration"
          rows={[
            ["Records Synced Today", "142"],
            ["Pending Uploads", "8"],
            ["System Compliance", "100%"],
            ["Last Government Sync", "2 hours ago"],
          ]}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Primary tone="blue" title="Generate Weekly Report" onPress={() => {}} />
        <Primary tone="green" title="Export Data" onPress={() => {}} />
        <Primary tone="purple" title="Government Sync" onPress={() => {}} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Last 20 Insertions</Text>

        {last20Loading ? (
          <Text style={styles.muted}>⏳ Loading...</Text>
        ) : last20Error ? (
          <Text style={styles.error}>⚠️ {last20Error}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                {last20HeaderCols.map((h) => (
                  <Text key={h} style={[styles.th, styles.cell]}>{h}</Text>
                ))}
              </View>
              {last20.length === 0 ? (
                <Text style={[styles.muted, { padding: 8 }]}>No rows found</Text>
              ) : (
                last20.map((row) => {
                  const createdAt = new Date(row.created_at);
                  const reminderDate = new Date(createdAt);
                  reminderDate.setMonth(reminderDate.getMonth() + 9);
                  const overdue = reminderDate < new Date();
                  return (
                    <View key={row.id} style={styles.tr}>
                      <Text style={styles.td}>{row.id}</Text>
                      <Text style={styles.td}>{row.name}</Text>
                      <Text style={styles.td}>{row.age}</Text>
                      <Text style={styles.td}>{row.past_pregnancy_count}</Text>
                      <Text style={styles.td}>{row.blood_group_mother}</Text>
                      <Text style={styles.td}>{row.blood_group_father}</Text>
                      <Text style={styles.td}>{row.medical_bg_mother}</Text>
                      <Text style={styles.td}>{row.medical_bg_father}</Text>
                      <Text style={styles.td}>{row.delivery_type}</Text>
                      <Text style={styles.td}>{row.haemoglobin}</Text>
                      <Text style={[styles.td, styles.muted]}>{createdAt.toLocaleDateString()}</Text>
                      <Text style={[styles.td, { color: overdue ? "#b91c1c" : "#1d4ed8", fontWeight: "700" }]}>
                        {reminderDate.toLocaleDateString()}
                      </Text>
                      <View style={[styles.td, { alignItems: "center" }]}>
                        <Pressable
                          onPress={() => markSurveyed(row.id)}
                          disabled={row.surveyed}
                          style={[
                            styles.surveyBtn,
                            row.surveyed ? styles.surveyDone : styles.surveyIdle,
                          ]}
                        >
                          {row.surveyed ? <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text> : null}
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );

  const PostDeliveriesTab = () => {
    const maxPage = Math.max(1, Math.ceil(pdTotal / pdPageSize));
    return (
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>Post-Delivery Records</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <SmallBtn title="Refresh" tone="blue" onPress={() => fetchPostDeliveries(pdPage, pdPageSize)} />
            <Text style={styles.muted}>Page {pdPage} — {pdTotal} total</Text>
          </View>
        </View>

        <View style={styles.card}>
          {pdLoading ? (
            <Text style={styles.muted}>⏳ Loading post-delivery records...</Text>
          ) : pdError ? (
            <Text style={styles.error}>⚠️ {pdError}</Text>
          ) : postDeliveries.length === 0 ? (
            <Text style={styles.muted}>No records found.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.tableHeaderRow}>
                  {["ID","Mother","Delivery Date","Child Kg","Complications","Child Diseases","Submitted At","External ID"].map((h) => (
                    <Text key={h} style={[styles.th, styles.cell]}>{h}</Text>
                  ))}
                </View>
                {postDeliveries.map((r) => {
                  const created = r.created_at ? new Date(r.created_at) : null;
                  const submitted = r.submitted_at ? new Date(r.submitted_at) : null;
                  const diseases =
                    Array.isArray(r.child_diseases_array) && r.child_diseases_array.length
                      ? r.child_diseases_array.join(", ")
                      : r.child_diseases || "-";
                  return (
                    <View key={r.id} style={styles.tr}>
                      <Text style={styles.td}>{r.id}</Text>
                      <Text style={styles.td}>{r.mother_name || "-"}</Text>
                      <Text style={styles.td}>
                        {r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : "-"}
                      </Text>
                      <Text style={styles.td}>{r.child_weight_kg ?? "-"}</Text>
                      <Text style={styles.td}>{r.complications || "-"}</Text>
                      <Text style={styles.td}>{diseases}</Text>
                      <Text style={styles.td}>
                        {submitted ? submitted.toLocaleString() : (created ? created.toLocaleString() : "-")}
                      </Text>
                      <Text style={styles.td}>{r.external_id || "-"}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {pdTotal > 0 && (
            <View style={styles.pagerRow}>
              <Text style={styles.muted}>
                Showing {Math.min((pdPage - 1) * pdPageSize + 1, pdTotal)}–{Math.min(pdPage * pdPageSize, pdTotal)} of {pdTotal}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SmallBtn
                  title="Prev"
                  tone="gray"
                  disabled={pdPage === 1}
                  onPress={() => setPdPage((p) => Math.max(1, p - 1))}
                />
                <SmallBtn
                  title="Next"
                  tone="gray"
                  disabled={pdPage >= maxPage}
                  onPress={() => setPdPage((p) => Math.min(maxPage, p + 1))}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const SettingsTab = () => (
    <View style={{ gap: 16 }}>
      <Text style={styles.cardTitle}>System Settings</Text>

      <View style={styles.grid2}>
        <View style={styles.card}>
          <Text style={styles.subTitle}>Alert Thresholds</Text>
          <View style={{ gap: 10 }}>
            <LabeledInput label="High Risk BP Threshold" defaultValue="140/90" />
            <LabeledInput label="Device Offline Alert (hours)" defaultValue="24" keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.subTitle}>Sync Settings</Text>
          <View style={{ gap: 10 }}>
            <LabeledInput label="Auto Sync Interval (minutes)" defaultValue="30" keyboardType="numeric" />
            <LabeledInput label="Government API Endpoint" defaultValue="https://api.gov.health.in/maternal" />
          </View>
        </View>
      </View>

      <Primary title="Save Settings" tone="blue" onPress={() => {}} />
    </View>
  );

  if (!user) {
    // Small placeholder while the redirect effect above runs.
    return (
      <View style={styles.centered}>
        <Text style={styles.warn}>Please sign in to continue.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Supervisor Dashboard</Text>
          <Text style={styles.hSub}>Monitor field operations and manage maternal health screening programs</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.mutedSmall, { color: "rgba(255,255,255,0.8)" }]}>Last Updated</Text>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{new Date().toLocaleString()}</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {tabs.map((t) => {
          const active = t.id === activeTab;
          return (
            <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.icon} {t.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {activeTab === "overview" && <Overview />}
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "fieldworkers" && <FieldWorkersTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "postdeliveries" && <PostDeliveriesTab />}
        {activeTab === "settings" && <SettingsTab />}
      </View>

      {/* Add Worker Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOuter}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.subTitle}>Add New Field Worker</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={{ fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              <LabeledInput
                label="Full Name"
                value={addForm.name}
                onChangeText={(v) => setAddForm((s) => ({ ...s, name: v }))}
              />
              <LabeledInput
                label="Area"
                value={addForm.area}
                onChangeText={(v) => setAddForm((s) => ({ ...s, area: v }))}
              />

              <View style={styles.row}>
                <LabeledInput
                  label="Status (active/inactive/offline)"
                  value={addForm.status}
                  onChangeText={(v) => setAddForm((s) => ({ ...s, status: v }))}
                  style={{ flex: 1 }}
                />
                <LabeledInput
                  label="Device (online/offline)"
                  value={addForm.deviceStatus}
                  onChangeText={(v) => setAddForm((s) => ({ ...s, deviceStatus: v }))}
                  style={{ flex: 1 }}
                />
              </View>

              <View style={styles.row}>
                <LabeledInput
                  label="Patients Today"
                  value={String(addForm.patientsToday)}
                  onChangeText={(v) => setAddForm((s) => ({ ...s, patientsToday: v }))}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                />
                <LabeledInput
                  label="High Risk Cases"
                  value={String(addForm.highRiskCases)}
                  onChangeText={(v) => setAddForm((s) => ({ ...s, highRiskCases: v }))}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                />
              </View>

              {!!addError && <Text style={styles.error}>{addError}</Text>}

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                <SmallBtn title="Cancel" tone="gray" onPress={() => setShowAddModal(false)} />
                <Pressable
                  onPress={submitAddWorker}
                  disabled={addSubmitting}
                  style={[styles.primaryBtn, addSubmitting && { backgroundColor: "#a3a3a3" }]}
                >
                  {addSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Add Worker</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ------------------- Styles ------------------- */
const styles = StyleSheet.create({
  page: {
    paddingBottom: 32,
    gap: 20,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  h1: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "800", 
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  hSub: { 
    color: "#c7d2fe", 
    fontSize: 14,
    letterSpacing: 0.3,
  },

  tabsRow: {
    paddingHorizontal: 16,
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  tabActive: { 
    borderColor: "#3b82f6",
    backgroundColor: "#f0f9ff",
  },
  tabText: { 
    color: "#6b7280", 
    fontWeight: "700",
    fontSize: 14,
  },
  tabTextActive: { 
    color: "#2563eb",
    fontWeight: "800",
  },

  metricsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12,
    paddingHorizontal: 4,
  },
  metric: { 
    flexBasis: "31%", 
    padding: 12, 
    borderRadius: 14, 
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricValue: { 
    fontSize: 22, 
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  metricLabel: { 
    fontSize: 13, 
    fontWeight: "600", 
    marginTop: 4,
    letterSpacing: 0.2,
  },

  card: { 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: "#e5e7eb", 
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 4,
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: "#111827", 
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subTitle: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: "#111827",
    letterSpacing: 0.2,
  },
  muted: { 
    color: "#6b7280",
    fontSize: 14,
  },
  mutedSmall: { 
    color: "#6b7280", 
    fontSize: 13,
  },

  alertRow: {
    flexDirection: "row",
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 10,
    gap: 10,
    alignItems: "flex-start",
    marginHorizontal: 4,
  },
  alertMsg: { 
    fontWeight: "700", 
    color: "#111827", 
    marginBottom: 3,
    fontSize: 15,
  },

  workerName: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: "#111827",
    letterSpacing: 0.2,
  },
  statsRow: { 
    flexDirection: "row", 
    gap: 18, 
    marginTop: 12,
    flexWrap: "wrap",
  },

  grid2: { 
    flexDirection: "row", 
    gap: 14, 
    flexWrap: "wrap",
  },

  primaryBtn: { 
    backgroundColor: "#2563eb", 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryBtnText: { 
    color: "#fff", 
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  tableHeaderRow: { 
    flexDirection: "row", 
    backgroundColor: "#f3f4f6", 
    borderBottomWidth: 1, 
    borderColor: "#e5e7eb",
  },
  cell: { 
    minWidth: 140,
  },
  th: { 
    padding: 10, 
    fontWeight: "800", 
    color: "#111827",
    fontSize: 14,
  },
  tr: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderColor: "#e5e7eb",
  },
  td: { 
    padding: 10, 
    minWidth: 140, 
    color: "#111827",
    fontSize: 14,
  },

  surveyBtn: { 
    width: 34, 
    height: 34, 
    borderRadius: 999, 
    borderWidth: 1, 
    alignItems: "center", 
    justifyContent: "center",
  },
  surveyIdle: { 
    backgroundColor: "#fff", 
    borderColor: "#9ca3af",
  },
  surveyDone: { 
    backgroundColor: "#16a34a", 
    borderColor: "#15803d",
  },

  modalOuter: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    padding: 20,
  },
  modalBackdrop: { 
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 12,
  },

  centered: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    padding: 20,
  },
  warn: { 
    color: "#b91c1c", 
    fontWeight: "700",
    fontSize: 14,
  },

  pagerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
});