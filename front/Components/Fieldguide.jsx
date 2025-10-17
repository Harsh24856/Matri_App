import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

export default function FieldGuide() {
  const navigation = useNavigation();
  const [selectedSection, setSelectedSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: "📋" },
    { id: "screening", title: "Screening Process", icon: "🔍" },
    { id: "risk-assessment", title: "Risk Assessment", icon: "⚠️" },
    { id: "counseling", title: "Counseling Guidelines", icon: "💬" },
    { id: "referrals", title: "Referrals & Follow-up", icon: "🏥" },
    { id: "offline-mode", title: "Offline Operations", icon: "📱" },
    { id: "troubleshooting", title: "Troubleshooting", icon: "🔧" },
  ];

  const content = {
    overview: {
      title: "Field Worker Guide Overview",
      content: `
Welcome to the Maternal Health Screening System

This guide will help you effectively use the offline-first maternal health screening and counseling system designed for serving underserved pregnant women in BPL households.

Key Objectives:
- Deliver risk screening and counseling to underserved communities
- Provide culturally sensitive health education
- Identify high-risk cases for immediate referral
- Maintain accurate health records for government integration

System Capabilities:
- Offline-First: Works without internet connectivity
- AI-Powered: On-device risk assessment and recommendations
- Cultural Sensitivity: Appropriate content for local communities
- Government Integration: Syncs with health systems when online

Your Role as a Field Worker:
You are the critical link between technology and community health, bringing essential maternal care directly to women who need it most.
`,
    },
    screening: {
      title: "Screening Process Guidelines",
      content: `
Maternal Health Screening Process

Pre-Delivery Screening Workflow

1. Initial Assessment
- Verify patient identity and basic information
- Confirm pregnancy status and gestational age
- Review previous pregnancy history if applicable

2. Health Data Collection
- Vital Signs: blood pressure, weight, temperature
- Medical History: previous conditions, family history
- Current Symptoms: any concerning symptoms or complaints
- Social Factors: living conditions, support system

3. Risk Factor Identification
The system will automatically flag:
- High blood pressure (greater than 140/90)
- Extreme maternal age (less than 18 or greater than 35)
- Previous pregnancy complications
- Multiple pregnancies
- Nutritional deficiencies

4. Immediate Actions
- Review AI-generated risk assessment
- Provide appropriate counseling based on risk level
- Schedule follow-up appointments
- Initiate referrals for high-risk cases

Post-Delivery Screening

1. Recovery Assessment
- Physical recovery progress
- Breastfeeding status and challenges
- Mental health screening
- Family planning counseling

2. Newborn Health Check
- Basic newborn assessment
- Vaccination schedule review
- Growth monitoring setup
`,
    },
    "risk-assessment": {
      title: "Understanding Risk Assessment",
      content: `
AI-Powered Risk Assessment System

Risk Categories

Low Risk (Green)
- Normal vital signs
- No significant medical history
- Regular prenatal care
Action: routine follow-up, standard counseling

Medium Risk (Yellow)
- Minor risk factors present
- Requires closer monitoring
Action: increased follow-up frequency, targeted counseling

High Risk (Red)
- Significant risk factors identified
- Immediate medical attention needed
Action: urgent referral, supervisor notification

Key Risk Indicators

Maternal Factors
- Age extremes (under 18 or over 35 years)
- Previous pregnancy complications
- Chronic medical conditions
- Substance use history

Pregnancy-Related Factors
- Multiple pregnancies (twins, triplets)
- Previous preterm births
- Gestational diabetes history
- Hypertensive disorders

Social Risk Factors
- Limited access to healthcare
- Poor nutritional status
- Lack of family support
- Economic hardship

Using Risk Scores
The AI system provides:
- Overall risk score on a 0-100 scale
- Specific risk probabilities for individual complications
- Recommended actions based on risk level
- Follow-up schedule suggestions
`,
    },
    counseling: {
      title: "Culturally Sensitive Counseling",
      content: `
Counseling Guidelines for Field Workers

Cultural Sensitivity Principles

1. Respect Local Customs
- Understand community beliefs about pregnancy
- Respect traditional practices that don't harm health
- Address misconceptions gently and respectfully

2. Language and Communication
- Use simple, clear language
- Avoid medical jargon
- Employ visual aids and animations when available
- Ensure privacy and confidentiality

3. Family Involvement
- Include family members when appropriate
- Address concerns of mothers-in-law and husbands
- Respect family decision-making processes

Key Counseling Topics

Nutrition During Pregnancy
- Importance of iron-rich foods
- Folic acid supplementation
- Safe food practices
- Managing nausea and food aversions

Warning Signs to Watch For
- Severe headaches or vision changes
- Heavy bleeding
- Severe abdominal pain
- Decreased fetal movement
- Signs of infection

Birth Preparedness
- Importance of skilled birth attendance
- Emergency transportation planning
- Essential supplies for delivery
- Postpartum care planning

Family Planning
- Spacing between pregnancies
- Available contraceptive methods
- Importance of preconception care

Using Educational Animations
- Select culturally appropriate content
- Ensure animations match local context
- Use animations to explain complex concepts
- Follow up with discussion and questions
`,
    },
    referrals: {
      title: "Referrals and Follow-up Management",
      content: `
Referral and Follow-up System

When to Refer Immediately

Emergency Referrals (call supervisor)
- Severe hypertension (greater than 160/110)
- Active bleeding
- Signs of preeclampsia or eclampsia
- Severe anemia (hemoglobin less than 7 g/dl)
- Mental health crisis

Urgent Referrals (within 24 hours)
- Moderate hypertension (140-159 / 90-109)
- Suspected gestational diabetes
- Persistent vomiting
- Signs of depression
- Fetal growth concerns

Routine Referrals (within 1 week)
- First prenatal visit
- Routine follow-up scheduling
- Vaccination needs
- Family planning counseling

Referral Process

1. Document the Case
- Complete risk assessment
- Note specific concerns
- Include vital signs and symptoms
- Add clinical observations

2. Contact Appropriate Level
- Emergency: call supervisor immediately
- Urgent: use priority communication channel
- Routine: standard referral form

3. Follow-up Tracking
- Schedule return visit
- Set reminder for follow-up
- Track referral outcomes
- Update patient records

Government System Integration

Data Synchronization
- Upload patient data when online
- Sync referral status updates
- Download new protocols and guidelines
- Report system metrics

Compliance Requirements
- Maintain accurate records
- Follow reporting schedules
- Ensure data privacy
- Complete required training modules
`,
    },
    "offline-mode": {
      title: "Offline Operations Guide",
      content: `
Working Offline: Complete Guide

Offline Capabilities

What Works Offline
- Complete patient screening and assessment
- AI-powered risk analysis
- Educational content and animations
- Data storage and record keeping
- Follow-up scheduling
- Basic reporting functions

What Requires Internet
- Data synchronization with government systems
- Software updates and new content
- Supervisor communication (unless using SMS)
- Real-time referral coordination

Data Management

Local Storage
- Patient records stored securely on device
- Encrypted data protection
- Automatic backup creation
- Storage capacity monitoring

Synchronization Process
1. Connect to the internet (WiFi or mobile data)
2. Automatic sync uploads pending data
3. Download updates: new protocols and content
4. Conflict resolution for any data conflicts
5. Verification: confirm successful sync

Best Practices for Offline Work

Daily Routine
- Start day with full battery charge
- Check available storage space
- Review scheduled appointments
- Prepare necessary forms and materials

Data Entry
- Complete all fields accurately
- Save frequently during data entry
- Use standardized terminology
- Double-check critical information

Battery Management
- Carry portable charger
- Use power-saving mode when needed
- Close unnecessary applications
- Plan charging during breaks

Troubleshooting Offline Issues

Common Problems
- Storage full: delete old synced records
- Battery low: use power-saving features
- App crashes: restart application and check data integrity
- Slow performance: clear cache and restart device

Data Recovery
- Access automatic backups
- Use data recovery tools
- Contact technical support
- Maintain paper backup for critical cases
`,
    },
    troubleshooting: {
      title: "Technical Troubleshooting",
      content: `
Technical Support and Troubleshooting

Common Technical Issues

Application Problems

App Won't Start
1. Restart the device
2. Check available storage (need 500MB minimum)
3. Clear app cache
4. Reinstall if necessary

Slow Performance
1. Close other applications
2. Clear temporary files
3. Restart device
4. Check for software updates

Data Entry Issues
1. Ensure all required fields are completed
2. Check data format (dates, numbers)
3. Save frequently
4. Use standardized terminology

Hardware Issues

Tablet Problems
- Screen issues: clean screen and check for cracks
- Battery problems: check charging cable and battery health
- Storage issues: delete old files and clear cache
- Connectivity: check WiFi and mobile data settings

Peripheral Devices
- Blood pressure monitor: check batteries and calibration
- Weight scale: ensure level surface and check batteries
- Thermometer: clean sensor and check batteries

Data Backup and Recovery

Automatic Backups
- Daily local backups created automatically
- Weekly cloud backup when online
- Critical data backed up immediately
- Recovery options available for 30 days

Manual Backup Process
1. Go to Settings > Data Management
2. Select "Create Backup"
3. Choose backup location (local or cloud)
4. Verify backup completion
5. Test restore process monthly

Getting Help

Self-Help Resources
- Built-in help documentation
- Video tutorials (when online)
- FAQ section
- Troubleshooting wizard

Contact Support
- Technical issues: use in-app support chat
- Medical questions: contact supervisor
- Emergency: use emergency contact system
- Training: schedule refresher sessions

Escalation Process
1. Level 1: self-troubleshooting (15 minutes)
2. Level 2: peer support (30 minutes)
3. Level 3: technical support (1 hour)
4. Level 4: supervisor intervention (immediate)

Preventive Maintenance

Daily Checks
- Battery level and charging
- Available storage space
- App functionality test
- Peripheral device status

Weekly Maintenance
- Clear cache and temporary files
- Update software when online
- Backup critical data
- Clean device and peripherals

Monthly Reviews
- Performance assessment
- Training needs evaluation
- Equipment condition check
- Process improvement suggestions
`,
    },
  };

  const section = content[selectedSection];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        {/* Header */}
        <LinearGradient
          colors={["#3B82F6", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>👩‍⚕️</Text>
          </View>
          <Text style={styles.headerTitle}>Field Worker Guide</Text>
          <Text style={styles.headerSubtitle}>
            Complete guide for maternal health screening in underserved communities
          </Text>
        </LinearGradient>

        {/* Body layout */}
        <View style={styles.bodyRow}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            {sections.map((s) => {
              const active = selectedSection === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedSection(s.id)}
                  style={[styles.sideBtn, active && styles.sideBtnActive]}
                >
                  <Text style={[styles.sideBtnIcon, active && styles.sideBtnIconActive]}>
                    {s.icon}
                  </Text>
                  <Text style={[styles.sideBtnText, active && styles.sideBtnTextActive]}>
                    {s.title}
                  </Text>
                </Pressable>
              );
            })}

            <View style={styles.quickBox}>
              <Text style={styles.quickTitle}>Quick Actions</Text>
              <Pressable
                onPress={() => navigation.navigate("PrePeg")}
                style={styles.quickLink}
              >
                <Text style={styles.quickLinkText}>→ Start Pre-Delivery Screening</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("PostDel")}
                style={styles.quickLink}
              >
                <Text style={styles.quickLinkText}>→ Start Post-Delivery Support</Text>
              </Pressable>
            </View>
          </View>

          {/* Main */}
          <View style={styles.main}>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.content}>{section.content}</Text>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => navigation.navigate("PrePeg")}
                style={[styles.actionBtn, styles.actionBtnPink]}
              >
                <Text style={styles.actionBtnText}>Start Pre-Delivery Screening</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("PostDel")}
                style={[styles.actionBtn, styles.actionBtnBlue]}
              >
                <Text style={styles.actionBtnText}>Start Post-Delivery Support</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  page: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f0f9ff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 3,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  headerIcon: { fontSize: 28 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#DBEAFE",
    textAlign: "center",
  },

  bodyRow: {
    flexDirection: "row",
  },

  /* Sidebar */
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  sideBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  sideBtnActive: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  sideBtnIcon: { fontSize: 18, marginRight: 10 },
  sideBtnIconActive: {},
  sideBtnText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  sideBtnTextActive: { color: "#1D4ED8" },

  quickBox: {
    marginTop: 12,
    backgroundColor: "#FEF9C3",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 10,
  },
  quickTitle: { fontWeight: "700", color: "#92400E", marginBottom: 8 },
  quickLink: {
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickLinkText: { color: "#92400E", fontSize: 13 },

  /* Main */
  main: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  content: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    whiteSpace: "pre-line",        // RN ignores this; kept here for clarity
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionBtnPink: { backgroundColor: "#ec4899" },
  actionBtnBlue: { backgroundColor: "#3b82f6" },
  actionBtnText: { color: "#fff", fontWeight: "700" },
});