/**
 * Fake TalentCona backend for the regression tests.
 *
 * Answers the admin portal's API calls with responses shaped like the Postman
 * examples (same envelope, field names and status codes), and keeps state, so
 * approving a withdrawal really changes the queue. Never used in production.
 *
 *   node e2e/mock/server.mjs            (port 4100, or MOCK_PORT)
 *
 * Test hooks (not part of the real API):
 *   POST /__reset          fresh data, cleared request log
 *   GET  /__requests       every API request since the last reset
 *   POST /__notify         add a notification { type, title, body, data }
 *   POST /__payout         add a pending withdrawal
 *   POST /__fail           { method, path, status } make the next matching call fail
 *
 * Sign-in: password "Password123!", MFA code "123456". Tests usually skip the
 * form by setting the refresh cookie (tc_refresh=super | limited).
 */
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT) || 4100;

// ---- helpers ----------------------------------------------------------------------------

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (claims) => `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "admin-1", email: "ada.admin@talentcona.test", exp: 4102444800, ...claims })}.mock`;
const ago = (h) => new Date(Date.now() - h * 3_600_000).toISOString();
const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString();

const ALL_PRIVILEGES = [
  "DASHBOARD_VIEW_AUDIT_LOG",
  "DASHBOARD_VIEW_PENDING_APPROVALS",
  "VIEW_AUDIT_LOG",
  "MANAGE_USERS",
  "MANAGE_ADMINS",
  "MANAGE_ADMISSIONS_ROUTING",
  "MANAGE_PROGRAMS",
  "MANAGE_TALENT_COMPANY_REQUESTS",
  "MANAGE_SUPPORT",
  "MANAGE_FINANCIAL_OPERATIONS",
  "MANAGE_LAPTOPS",
  "MANAGE_COMMUNITIES",
  "MANAGE_REFERRALS",
  "VIEW_REPORTS_INSIGHTS",
];
const ADMINS = {
  super: { isSuperAdmin: true, privileges: ALL_PRIVILEGES },
  limited: { isSuperAdmin: false, privileges: ["MANAGE_USERS", "VIEW_AUDIT_LOG"] },
};

// ---- data (rebuilt on every reset) -------------------------------------------------------

function seed() {
  const programs = [
    { id: "p-pm", title: "Project Management", school: { name: "School of Product & Project Management" } },
    { id: "p-fe", title: "Front-End Development", school: { name: "School of Engineering" } },
    { id: "p-ux", title: "UI/UX Design", school: { name: "School of Design" } },
  ];

  const enrollment = (enrollmentId, programId, status, progress, group) => ({
    enrollmentId,
    programId,
    title: programs.find((p) => p.id === programId).title,
    status,
    courseProgressPercent: progress,
    completedAt: group === "completed" ? ago(24 * 30) : null,
    finalScorePercent: group === "completed" ? 86 : null,
    group,
  });
  const students = [
    {
      id: "s-semi", fullName: "Semi Lore", email: "semi.lore@example.test", phoneNumber: "+2348000000001", city: "Ikeja", stateRegion: "Lagos", country: "Nigeria",
      profileAvatarUrl: null, joinedAt: ago(24 * 4), accountLabel: "Active", suspensionReason: null,
      paymentLabel: "Direct-Full", amountPaidMinor: 45000000, currency: "NGN", minorUnit: 100, laptopIncluded: false,
      enrollments: [enrollment("e-pm", "p-pm", "PendingMentorMatch", 0, "current"), enrollment("e-ux", "p-ux", "Active", 40, "current")],
    },
    {
      id: "s-usman", fullName: "New Student Usman", email: "usman.student@example.test", phoneNumber: null, city: null, stateRegion: null, country: null,
      profileAvatarUrl: null, joinedAt: ago(24 * 5), accountLabel: "Active", suspensionReason: null,
      paymentLabel: "Direct-Full", amountPaidMinor: 25200000, currency: "NGN", minorUnit: 100, laptopIncluded: false,
      enrollments: [enrollment("e-fe", "p-fe", "Active", 65, "current")],
    },
    {
      id: "s-daani", fullName: "Daani Olora", email: "daani@example.test", phoneNumber: null, city: null, stateRegion: null, country: null,
      profileAvatarUrl: null, joinedAt: ago(24 * 20), accountLabel: "Suspended", suspensionReason: "Spam", suspendedAt: ago(24 * 2),
      paymentLabel: null, amountPaidMinor: null, currency: null, minorUnit: null, laptopIncluded: null, enrollments: [],
    },
  ];
  const assignments = {};

  const application = (o) => ({
    id: `app-${o.id}`, status: "Approved", professionalBio: "Product designer who has mentored junior designers for six years.", country: "Nigeria",
    totalYearsExperience: 6, linkedinOrPortfolioUrl: "https://example.test/portfolio", introVideoUrl: null, systemRating: 4,
    systemRatingSummary: "Strong portfolio and relevant experience.", adminRating: null, submittedAt: ago(30), reviewedAt: null, rejectionReason: null,
    highestEducationalLevel: { slug: "bachelors-degree", label: "Bachelor's Degree" }, expertise: [{ label: "UI/UX Design", yearsOfExperience: 3 }],
    ...o.application,
  });
  const mentors = [
    { id: "m-pend", fullName: "Grace Okafor", email: "grace.okafor@example.test", programs: [], application: { status: "Submitted", submittedAt: ago(2) } },
    { id: "m-appr", fullName: "Usman Soliu", email: "usman.soliu@example.test", currentStudentCount: 3, maxStudents: 10, capacity: "Available", averageRating: 4.5, ratingCount: 4,
      programs: [{ programId: "p-fe", title: "Front-End Development", mentor: true, advisor: false, assignedAt: ago(24 * 30), menteeCount: 3 }],
      application: { status: "Approved", adminRating: 5, reviewedAt: ago(24 * 40) } },
    { id: "m-unas", fullName: "Bola Tito", email: "bola.tito@example.test", programs: [], application: { status: "Approved", adminRating: 4, reviewedAt: ago(24 * 3) } },
    { id: "m-draft", fullName: "Idris O", email: "idris.o@example.test", programs: [], application: { status: "Draft", submittedAt: null, systemRating: null } },
  ].map((m) => ({ accountLabel: "Active", suspensionReason: null, currentStudentCount: 0, maxStudents: 10, capacity: "Available", averageRating: null, ratingCount: 0, profileAvatarUrl: null, ...m, application: application(m) }));

  const n = (id, o) => ({ id, data: null, readAt: null, ...o });
  const notifications = [
    n("n-1", { type: "MENTOR_APPLICATION_SUBMITTED", title: "New mentor application", body: "Grace Okafor submitted a mentor application.", data: { url: "/user-management/mentors/review/m-pend" }, createdAt: ago(0.1) }),
    n("n-2", { type: "URGENT_MENTOR_REQUEST", title: "Urgent mentor request", body: "Semi Lore needs a mentor for Project Management.", createdAt: ago(0.2) }),
    n("n-3", { type: "PASSWORD_CHANGED", title: "Password changed", body: "Your TalentCona password was changed successfully.", readAt: ago(40), createdAt: ago(48) }),
    ...Array.from({ length: 22 }, (_, i) =>
      n(`n-old-${i}`, { type: "STUDENT_REGISTERED", title: `Older notification ${i + 1}`, body: "A student registered.", readAt: ago(24 * 4), createdAt: ago(24 * (3 + i)) }),
    ),
  ];

  const actor = (id, fullName, userType) => ({ id, fullName, email: `${id}@example.test`, userType, profileAvatarUrl: null });
  const intern = actor("adm-2", "Kemi Okon", "Admin");
  const entry = (id, o) => ({
    id, actorUserId: o.actor?.id ?? null, actorUserType: o.actor?.userType ?? "System", entityId: `ent-${id}`, scopeType: null, scopeId: null,
    metadata: {}, ipAddress: null, userAgent: null, requestId: null, categories: ["Change"], ...o, primaryCategory: (o.categories ?? ["Change"])[0],
  });
  const auditLogs = [
    entry("al-1", { actor: actor("s-semi", "Semi Lore", "Student"), action: "WALLET_ENROLLMENT_DEBITED", entityType: "WALLET", metadata: { amountMinor: 20000000 }, createdAt: ago(0.5) }),
    entry("al-2", { actor: intern, action: "MENTOR_MATCHED", entityType: "MENTOR_ASSIGNMENT", metadata: { programId: "p-fe", source: "admin" }, ipAddress: "104.22.160.19",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", requestId: "req-123", createdAt: ago(1) }),
    entry("al-3", { actor: null, action: "ADMIN_MFA_VERIFICATION_FAILED", entityType: "AUTH", metadata: { attempts: 4 }, ipAddress: "41.210.18.44", categories: ["Security"], createdAt: ago(2) }),
    entry("al-4", { actor: intern, action: "ADMIN_ROLES_UPDATED", entityType: "ADMIN", metadata: { before: { privileges: "MANAGE_USERS" }, after: { privileges: "MANAGE_USERS, MANAGE_ADMINS" } },
      categories: ["Critical", "Change"], createdAt: ago(3) }),
    entry("al-5", { actor: intern, action: "WITHDRAWAL_APPROVED", entityType: "WITHDRAWAL", categories: ["Approval"], createdAt: ago(4) }),
    entry("al-6", { actor: actor("m-appr", "Usman Soliu", "Mentor"), action: "MENTOR_APPLICATION_SUBMITTED", entityType: "MENTOR_APPLICATION", createdAt: ago(30) }),
    ...Array.from({ length: 120 }, (_, i) =>
      entry(`al-old-${i}`, { actor: intern, action: i % 2 ? "PROGRAM_MODULE_UPDATED" : "LOGIN", entityType: i % 2 ? "PROGRAM" : "AUTH", categories: [i % 2 ? "Change" : "Access"], createdAt: ago(48 + i) }),
    ),
  ];

  const user = (id, fullName, email, userType = "Student") => ({ id, fullName, email, phoneNumber: "+2348012345678", userType, createdAt: ago(24 * 60) });
  const usman = user("u-usman", "Usman Soliu", "usman.ref@example.test");
  const odinaka = user("u-odinaka", "Odinaka Solomon", "odinaka@example.test", "Mentor");
  const wd = (o) => ({ walletId: "wal-1", currency: "NGN", minorUnit: 100, bankName: "OPay Digital Services Limited (OPay)", bankCode: "999992", note: null, reviewNote: null, reviewedAt: null, disbursedAt: null, ...o });
  const withdrawals = [
    wd({ id: "w-pend", userId: usman.id, user: usman, amount: 5000000, status: "Pending", accountNumber: "8101424375", accountName: "Usman Soliu", note: "Monthly payout", createdAt: ago(24) }),
    wd({ id: "w-appr", userId: odinaka.id, user: odinaka, amount: 1350000, status: "Approved", bankName: "Access Bank", accountNumber: "0987654321", accountName: "Odinaka Solomon", reviewedAt: ago(20), createdAt: ago(48) }),
    wd({ id: "w-done", userId: usman.id, user: usman, amount: 900000, status: "Disbursed", accountNumber: "8101424375", accountName: "Usman Soliu", disbursedAt: ago(24 * 40), createdAt: ago(24 * 41) }),
  ];
  const referrers = {
    [usman.id]: { userId: usman.id, truncatedUserId: "u-usman", fullName: "Usman Soliu", email: usman.email, userType: "Student", memberSince: ago(24 * 200), referralCode: "TC2723FCE5",
      shareUrl: "https://staging.talentcona.com/signup?role=student&ref=TC2723FCE5", linkClicks: 4, referrals: 1, paidConversions: 2, conversionRate: 200, totalEarnedMinor: 2160000 },
    [odinaka.id]: { userId: odinaka.id, truncatedUserId: "u-odinak", fullName: "Odinaka Solomon", email: odinaka.email, userType: "Mentor", memberSince: ago(24 * 120), referralCode: "TC6B1A6AF4",
      shareUrl: "https://staging.talentcona.com/signup?role=student&ref=TC6B1A6AF4", linkClicks: 9, referrals: 1, paidConversions: 1, conversionRate: 100, totalEarnedMinor: 675000 },
  };
  const ledger = [
    { id: "L1", ref: usman.id, referee: "Adeleke Isaac", programId: "p-pm", paid: 18000000, commission: 900000, status: "Paid", at: ago(24 * 6) },
    { id: "L2", ref: usman.id, referee: "Adeleke Isaac", programId: "p-fe", paid: 25200000, commission: 1260000, status: "Paid", at: ago(24 * 6) },
    { id: "L3", ref: odinaka.id, referee: "Clement Isaac", programId: "p-ux", paid: 13500000, commission: 0, status: "No Commission", at: ago(24 * 90) },
  ];

  const members = [
    { id: "admin-1", email: "ada.admin@talentcona.test", fullName: "Ada Admin", status: "Active", lastLoginAt: ago(1), isSuperAdmin: true, privileges: ALL_PRIVILEGES, isProgramAdvisor: false, programs: [] },
    { id: "adm-2", email: "kemi.okon@talentcona.test", fullName: "Kemi Okon", status: "Active", lastLoginAt: ago(30), isSuperAdmin: false, privileges: ["MANAGE_USERS"], isProgramAdvisor: false, programs: [] },
    { id: "adm-3", email: "tunde.bello@talentcona.test", fullName: "Tunde Bello", status: "Inactive", lastLoginAt: ago(24 * 30), isSuperAdmin: false, privileges: ["VIEW_AUDIT_LOG"], isProgramAdvisor: false, programs: [] },
  ];
  const invitations = [
    { id: "inv-1", email: "new.admin@talentcona.test", fullName: "New Admin", status: "Pending", expiresAt: inDays(3), isProgramAdvisor: false, isExpired: false, privileges: [{ privilege: "VIEW_AUDIT_LOG" }], programs: [] },
  ];

  const queue = [
    { studentId: "s-q1", fullName: "Chioma Okwara", email: "chioma@example.test", stage: "Payment", progressPercent: 60, stuckSince: ago(24 * 3), constraint: "Payment not completed",
      selectedProgramSummaries: [{ id: "p-pm", title: "Project Management", school: { name: "School of Product & Project Management" } }], phoneNumber: "+2348000000002", motivation: "Career change", learningGoal: ["Get a job"], createdAt: ago(24 * 5) },
  ];
  const campaigns = [
    { id: "c-1", studentId: "s-semi", goalAmountMinor: 45000000, raisedAmountMinor: 9000000, currency: "NGN", minorUnit: 100, progressPercent: 20, personalMessage: "Help me learn PM", createdAt: ago(24 * 2),
      student: { id: "s-semi", fullName: "Semi Lore", email: "semi.lore@example.test" }, programTitles: ["Project Management"] },
  ];
  const loans = [
    { id: "loan-1", studentId: "s-usman", amount: 20000000, currency: "NGN", minorUnit: 100, interestRate: "5", totalAmount: 21000000, repaymentPeriod: 6, monthlyPayment: 3500000, status: "Pending",
      reason: "I can't pay all at once", createdAt: ago(24), items: [{ id: "li-1", itemType: "Tuition", description: "Front-End Development tuition" }],
      student: { id: "s-usman", fullName: "New Student Usman", email: "usman.student@example.test" } },
  ];

  const requests = [
    { id: "tr-1", referenceId: "TR-0001", status: "Pending", companyName: "Acme Labs", contactFirstName: "Sarah", contactLastName: "Johnson", email: "sarah@acme.test", phone: "+2348000000003",
      country: "Nigeria", city: "Lagos", website: "https://acme.test", description: "Two front-end developers", deadline: inDays(14), createdAt: ago(5), totalPositions: 2,
      roles: [{ id: "r-1", title: "Front-End Developer", employmentType: "FullTime", seniorityLevel: "Junior", positionCount: 2, requiredSkills: ["React"], niceToHaveSkills: ["TypeScript"] }] },
  ];
  const talents = [
    { id: "t-1", status: "Available", targetRole: "Front-End Developer", seeking: "FullTime", programSkills: ["React", "CSS"], submittedAt: ago(24 * 10),
      student: { id: "s-usman", fullName: "New Student Usman", email: "usman.student@example.test", phoneNumber: "+2348000000004", city: "Abuja", country: "Nigeria" },
      programTitle: "Front-End Development", cohortLabel: "Cohort 3", completedAt: ago(24 * 15), finalGradePercent: 88, certifications: ["Front-End Development"], projectsCompleted: 5 },
  ];

  return {
    programs, students, assignments, mentors, notifications, auditLogs, withdrawals, referrers, ledger,
    settings: { rewardPercent: 5, rewardBps: 500, updatedAt: ago(24), updatedByUserId: null },
    members, invitations, queue, campaigns, loans, requests, talents,
    pushSubs: [], log: [], failNext: [], seq: 1000,
  };
}

let db = seed();

// ---- http plumbing ----------------------------------------------------------------------

function send(res, status, data, error = null, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify({ success: status < 400, data, error, meta: { requestId: "mock-req", timestamp: new Date().toISOString() } }));
}
const fail = (res, status, message, code = `HTTP_${status}`) => send(res, status, null, { code, message });
const file = (res, name, body, type = "text/csv; charset=utf-8") => {
  res.writeHead(200, { "Content-Type": type, "Content-Disposition": `attachment; filename="${name}"` });
  res.end(body);
};
/** Cursor paging, as the backend does it: { items, limit, hasNext, nextCursor }. */
function cursorPage(res, query, items) {
  const limit = Number(query.limit || 20);
  const start = Number(query.cursor || 0);
  const next = start + limit < items.length ? String(start + limit) : null;
  send(res, 200, { items: items.slice(start, start + limit), limit, hasNext: !!next, nextCursor: next });
}
/** Page paging: { items, page, pageSize, total, totalPages }. */
function pagePage(res, query, items) {
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 20);
  send(res, 200, { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length, totalPages: Math.ceil(items.length / pageSize) });
}
const cookieOf = (req, name) => (req.headers.cookie ?? "").split(/;\s*/).map((c) => c.split("=")).find(([k]) => k === name)?.[1];

// ---- shapes ------------------------------------------------------------------------------

const studentRow = (s) => ({
  id: s.id, fullName: s.fullName, email: s.email, profileAvatarUrl: s.profileAvatarUrl, joinedAt: s.joinedAt, accountLabel: s.accountLabel,
  programs: s.enrollments.map(({ enrollmentId, programId, title, status }) => ({ enrollmentId, programId, title, status })),
  paymentLabel: s.paymentLabel, amountPaidMinor: s.amountPaidMinor, currency: s.currency, minorUnit: s.minorUnit, laptopIncluded: s.laptopIncluded,
});
const mentorSection = (m) =>
  ["Submitted", "UnderReview"].includes(m.application.status) ? "pending" : m.application.status !== "Approved" ? null : m.programs.length ? "assigned" : "unassigned";
const mentorRow = (m) => ({
  id: m.id, fullName: m.fullName, email: m.email, profileAvatarUrl: null, expertise: m.application.expertise.map((e) => e.label), totalYearsExperience: m.application.totalYearsExperience,
  systemRating: m.application.systemRating, adminRating: m.application.adminRating, programs: m.programs.map((p) => ({ id: p.programId, title: p.title })),
  currentStudentCount: m.currentStudentCount, maxStudents: m.maxStudents, averageRating: m.averageRating, capacity: m.capacity,
  applicationStatus: m.application.status, submittedAt: m.application.submittedAt, reviewedAt: m.application.reviewedAt,
});
const ledgerItem = (l) => {
  const r = db.referrers[l.ref];
  return {
    id: l.id, referrer: { userId: r.userId, truncatedUserId: r.truncatedUserId, fullName: r.fullName, email: r.email, referralCode: r.referralCode },
    referee: { userId: `u-${l.referee}`, truncatedUserId: "u-ref", fullName: l.referee, email: "referee@example.test" },
    programId: l.programId, programTitle: db.programs.find((p) => p.id === l.programId).title,
    amountPaidMinor: l.paid, commissionMinor: l.commission, ledgerStatus: l.status, currency: "NGN", minorUnit: 100, creditedAt: l.at,
  };
};
const withdrawalSummary = (w) => ({
  id: w.id, status: w.status, amountMinor: w.amount, currency: w.currency, minorUnit: w.minorUnit, bankName: w.bankName, accountName: w.accountName,
  accountNumberMasked: `******${w.accountNumber.slice(-4)}`, requestedAt: w.createdAt, disbursedAt: w.disbursedAt,
});
const series = (from) => {
  const out = [];
  const d = new Date(from ?? Date.now() - 90 * 86_400_000);
  d.setDate(1);
  for (let i = 0; d <= new Date() && i < 24; i++, d.setMonth(d.getMonth() + 1)) {
    out.push({ period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, periodLabel: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }), referredSignups: i + 1, paidConversions: i });
  }
  return { range: "custom", granularity: "month", points: out };
};
function auditFilter(q) {
  const now = Date.now();
  const days = { "1d": 1, "7d": 7, "30d": 30 }[q.range || "7d"];
  const from = q.range === "custom" ? (q.from ? Date.parse(`${q.from}T00:00:00Z`) : 0) : now - days * 86_400_000;
  const to = q.range === "custom" && q.to ? Date.parse(`${q.to}T23:59:59.999Z`) : now;
  const s = String(q.search || "").toLowerCase();
  const cats = q.categories ? String(q.categories).split(",") : [];
  return db.auditLogs.filter((e) => {
    const t = Date.parse(e.createdAt);
    if (t < from || t > to) return false;
    if (cats.length && !e.categories.some((c) => cats.includes(c))) return false;
    return !s || [e.actor?.fullName, e.actor?.email, e.id, e.action, e.ipAddress, e.entityType].some((v) => v && String(v).toLowerCase().includes(s));
  });
}

// ---- routes ------------------------------------------------------------------------------

async function route(req, res, m, path, q, body) {
  // Test hooks.
  if (path === "/__reset") return (db = seed()), send(res, 200, { ok: true });
  if (path === "/__requests") return send(res, 200, db.log);
  if (path === "/__notify") {
    const n = { id: `n-${++db.seq}`, type: body?.type ?? "TALENT_REQUEST_SUBMITTED", title: body?.title ?? "New hiring request", body: body?.body ?? null, data: body?.data ?? null, readAt: null, createdAt: new Date().toISOString() };
    db.notifications.unshift(n);
    return send(res, 200, n);
  }
  if (path === "/__payout") {
    const u = db.withdrawals[0].user;
    db.withdrawals.unshift({ ...db.withdrawals[0], id: `w-${++db.seq}`, user: u, amount: 2500000, status: "Pending", note: null, reviewedAt: null, createdAt: new Date().toISOString() });
    return send(res, 200, { ok: true });
  }
  if (path === "/__fail") return db.failNext.push(body), send(res, 200, { ok: true });

  // Auth.
  if (path === "/auth/login" && m === "POST") {
    if (!body?.email || body?.password !== "Password123!") return fail(res, 401, "Invalid email or password", "Unauthorized");
    return send(res, 200, { accessToken: token({ adminMfa: "pending_mfa_verify" }), userType: "Admin", clientApp: "admin", admin: ADMINS.super, mfaRequired: true, mfaChallengeToken: "challenge-1", mfaChallengePurpose: "verify" });
  }
  if (path === "/auth/admin/mfa/verify" && m === "POST") {
    if (body?.code !== "123456") return fail(res, 400, "Invalid verification code");
    return send(res, 200, { accessToken: token({ adminMfa: "complete" }), userType: "Admin", clientApp: "admin", admin: ADMINS.super }, null, { "Set-Cookie": "tc_refresh=super; Path=/; HttpOnly; SameSite=Lax" });
  }
  if (path === "/auth/refresh") {
    const who = cookieOf(req, "tc_refresh");
    if (!ADMINS[who]) return fail(res, 401, "Unauthorized", "Unauthorized");
    return send(res, 200, { accessToken: token({ adminMfa: "complete" }), admin: ADMINS[who] });
  }
  if (path === "/auth/logout") return send(res, 200, { ok: true }, null, { "Set-Cookie": "tc_refresh=; Path=/; Max-Age=0" });

  // Programs.
  if (path === "/programs/admin") return pagePage(res, q, db.programs);

  // Notifications.
  if (path === "/notifications" && m === "GET") return cursorPage(res, q, db.notifications);
  if (path === "/notifications/unread-count") return send(res, 200, { count: db.notifications.filter((x) => !x.readAt).length });
  if (path === "/notifications/read-all" && m === "POST") {
    let updatedCount = 0;
    for (const x of db.notifications) {
      if (x.readAt) continue;
      x.readAt = new Date().toISOString();
      updatedCount++;
    }
    return send(res, 200, { updatedCount });
  }
  let r;
  if ((r = path.match(/^\/notifications\/([^/]+)\/read$/)) && m === "PATCH") {
    const x = db.notifications.find((y) => y.id === r[1]);
    if (!x) return fail(res, 404, "Notification not found");
    x.readAt ??= new Date().toISOString();
    return send(res, 200, x);
  }
  if (path === "/notifications/web-push/vapid-public-key") return send(res, 200, { publicKey: "BPQeE_Z5Xt8a-EK_RKrA1Dg6fv8DfbDZpSx-oSrRecTmWRg52DjCfJQni4zF8oy0L2Xa0jNAZ0jEky-Eklp5Z1U" });
  if (path === "/notifications/web-push/subscribe") return m === "DELETE" ? (res.writeHead(204), res.end()) : send(res, 201, { id: "ps-1", endpoint: body?.endpoint });

  // Audit logs.
  if (path === "/audit/logs") return cursorPage(res, q, auditFilter(q));
  if (path === "/audit/logs/summary") {
    const list = auditFilter(q);
    return send(res, 200, { range: q.range || "7d", events: list.length, adminChanges: list.filter((e) => e.actorUserType === "Admin" && !e.categories.includes("Access")).length, securityEvents: list.filter((e) => e.categories.includes("Security")).length });
  }
  if (path === "/audit/logs/export" && m === "POST") return send(res, 200, { jobId: `job-${++db.seq}` });

  // Students.
  if (path === "/students/admin") {
    const s = String(q.search || "").toLowerCase();
    return cursorPage(res, q, db.students.filter((x) => (!s || `${x.fullName} ${x.email}`.toLowerCase().includes(s)) && (!q.accountStatus || x.accountLabel === q.accountStatus)).map(studentRow));
  }
  if ((r = path.match(/^\/students\/admin\/([^/]+)(?:\/(notify|suspend|reinstate))?$/))) {
    const s = db.students.find((x) => x.id === r[1]);
    if (!s) return fail(res, 404, "Student not found", "NOT_FOUND");
    if (r[2] === "notify") return send(res, 200, { accepted: true });
    if (r[2] === "suspend") return Object.assign(s, { accountLabel: "Suspended", suspensionReason: body?.reason ?? null }), send(res, 200, { id: s.id, accountLabel: "Suspended" });
    if (r[2] === "reinstate") return Object.assign(s, { accountLabel: "Active", suspensionReason: null }), send(res, 200, { id: s.id, accountLabel: "Active" });
    const group = (g) => s.enrollments.filter((e) => e.group === g);
    return send(res, 200, { ...studentRow(s), phoneNumber: s.phoneNumber, city: s.city, stateRegion: s.stateRegion, country: s.country, suspensionReason: s.suspensionReason,
      programs: { current: group("current"), completed: group("completed"), closed: [] } });
  }
  if ((r = path.match(/^\/students\/admin\/([^/]+)\/enrollments\/([^/]+)(?:\/([a-z-]+))?$/))) {
    const s = db.students.find((x) => x.id === r[1]);
    const e = s?.enrollments.find((x) => x.enrollmentId === r[2]);
    if (!e) return fail(res, 404, "Enrollment not found", "NOT_FOUND");
    const a = (db.assignments[e.enrollmentId] ??= { mentorId: null, advisorId: null });
    const person = (id) => (id ? (() => { const mm = db.mentors.find((x) => x.id === id); return mm ? { id: mm.id, fullName: mm.fullName, email: mm.email, userType: "Mentor" } : null; })() : null);
    switch (r[3]) {
      case undefined:
        return send(res, 200, { enrollmentId: e.enrollmentId, programId: e.programId, programTitle: e.title, status: e.status, courseProgressPercent: e.courseProgressPercent,
          mentor: person(a.mentorId), advisor: person(a.advisorId), paymentLabel: s.paymentLabel, amountPaidMinor: s.amountPaidMinor, currency: s.currency, minorUnit: s.minorUnit,
          laptopIncluded: s.laptopIncluded, lastActiveAt: ago(3), activity: { items: [{ id: "act-1", action: "ENROLLED", label: "Enrolled", detail: e.title, createdAt: ago(24 * 4) }], limit: 20, hasNext: false, nextCursor: null } });
      case "performance":
        return send(res, 200, { programProgressPercent: e.courseProgressPercent, metrics: { completedModulesCount: 2, totalModulesCount: 5, moduleCompletionRate: 40, mcqPointsPercent: 70, mcqPassRatePercent: 80, mcqAttemptCount: 3,
          assessmentsCompleted: 1, assessmentsTotal: 2 }, assessments: { items: [], completedCount: 1, totalCount: 2, averageScorePercent: 70 }, miniProjects: { items: [], completedCount: 0, totalCount: 1 }, finalProject: null });
      case "engagement":
        return send(res, 200, { overview: { lastActiveAt: ago(3), communitiesCount: 1, sessionsCompletedCount: 2 } });
      case "campaign":
        return send(res, 200, null);
      case "assignment-options":
        return send(res, 200, { mentors: db.mentors.filter((x) => x.application.status === "Approved").map((x) => ({ id: x.id, fullName: x.fullName, email: x.email })), advisors: [{ id: "m-unas", fullName: "Bola Tito", email: "bola.tito@example.test" }] });
      case "assignment":
        if (m === "PATCH") {
          if (body?.mentorId) a.mentorId = body.mentorId;
          if (body?.advisorId) a.advisorId = body.advisorId;
          if (a.mentorId) e.status = "Active";
          return send(res, 200, { id: `as-${e.enrollmentId}`, enrollmentId: e.enrollmentId, ...a, status: "ManuallyAssigned" });
        }
        return send(res, 200, { id: `as-${e.enrollmentId}`, status: a.mentorId ? "ManuallyAssigned" : "PendingMentorMatch", mentor: person(a.mentorId), advisor: person(a.advisorId) });
    }
  }

  // Mentors.
  if (path === "/mentors/admin/summary") {
    const approved = db.mentors.filter((x) => x.application.status === "Approved");
    return send(res, 200, { pendingReviewCount: db.mentors.filter((x) => mentorSection(x) === "pending").length, totalMentors: approved.length,
      mentorCount: approved.filter((x) => x.programs.some((p) => p.mentor)).length, programAdvisorCount: approved.filter((x) => x.programs.some((p) => p.advisor)).length });
  }
  if (path === "/mentors/admin") {
    if (q.section && q.statuses) return fail(res, 400, "Use either section or statuses, not both.", "Bad Request");
    const statuses = q.statuses ? String(q.statuses).split(",") : null;
    const s = String(q.search || "").toLowerCase();
    return cursorPage(res, q, db.mentors.filter((x) => (statuses ? statuses.includes(x.application.status) : mentorSection(x) === q.section) && (!s || `${x.fullName} ${x.email}`.toLowerCase().includes(s))).map(mentorRow));
  }
  if ((r = path.match(/^\/mentors\/admin\/([^/]+)(?:\/([a-z-]+))?(?:\/([^/]+))?$/))) {
    const x = db.mentors.find((y) => y.id === r[1]);
    if (!x) return fail(res, 404, "Mentor not found", "NOT_FOUND");
    const a = x.application;
    switch (r[2]) {
      case undefined:
        return send(res, 200, { ...x, application: a });
      case "rating":
        a.adminRating = body?.adminRating;
        return send(res, 200, { id: x.id, adminRating: a.adminRating });
      case "approve":
      case "reject":
      case "request-changes":
        if (!["Submitted", "UnderReview"].includes(a.status)) return fail(res, 409, "Application is not pending", "CONFLICT");
        a.status = { approve: "Approved", reject: "Rejected", "request-changes": "ChangesRequested" }[r[2]];
        a.reviewedAt = new Date().toISOString();
        a.rejectionReason = body?.reason ?? null;
        return send(res, 200, { id: a.id, status: a.status });
      case "programs":
        if (r[3]) return send(res, 200, { performance: { sessionsCompletedCount: 4, averageDurationMinutes: 45, averageResponseTimeMinutes: 30, averageRating: 4.5 }, activity: { sessions: [], feedback: [] }, mentees: [] });
        if (m === "PUT") {
          x.programs = (body?.programs ?? []).map((p) => ({ ...p, title: db.programs.find((pp) => pp.id === p.programId)?.title ?? "Program", assignedAt: new Date().toISOString(), menteeCount: 0 }));
          return send(res, 200, { programs: x.programs });
        }
        return send(res, 200, x.programs);
      case "notify":
        return send(res, 200, { accepted: true });
      case "suspend":
        return (x.accountLabel = "Suspended"), send(res, 200, { id: x.id });
      case "reinstate":
        return (x.accountLabel = "Active"), send(res, 200, { id: x.id });
    }
  }

  // Admin management.
  if (path === "/admin-portal/team/catalog") {
    return send(res, 200, { privileges: ALL_PRIVILEGES.map((p) => ({ privilege: p, label: p.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), group: "General" })) });
  }
  if (path === "/admin-portal/team/members") return pagePage(res, q, db.members);
  if (path === "/admin-portal/team/invitations/pending") return pagePage(res, q, db.invitations);
  if (path === "/admin-portal/team/invitations" && m === "POST") {
    if (!body?.email || !body?.privileges?.length) return fail(res, 400, "email and privileges are required");
    db.invitations.unshift({ id: `inv-${++db.seq}`, email: body.email, fullName: body.fullName ?? null, status: "Pending", expiresAt: inDays(7), isProgramAdvisor: !!body.isProgramAdvisor, isExpired: false,
      privileges: body.privileges.map((p) => ({ privilege: p })), programs: [] });
    return send(res, 201, db.invitations[0]);
  }
  if ((r = path.match(/^\/admin-portal\/team\/invitations\/([^/]+)\/(resend|revoke)$/))) {
    const i = db.invitations.findIndex((x) => x.id === r[1]);
    if (i < 0) return fail(res, 404, "Invitation not found");
    if (r[2] === "revoke") db.invitations.splice(i, 1);
    else db.invitations[i].expiresAt = inDays(7);
    return send(res, 200, { ok: true });
  }
  if ((r = path.match(/^\/admin-portal\/team\/members\/([^/]+)(?:\/(deactivate|reactivate|mfa))?$/))) {
    const x = db.members.find((y) => y.id === r[1]);
    if (!x) return fail(res, 404, "Member not found");
    if (r[2] === "deactivate") x.status = "Inactive";
    else if (r[2] === "reactivate") x.status = "Active";
    else if (!r[2] && m === "PUT") Object.assign(x, { privileges: body?.privileges ?? x.privileges, isProgramAdvisor: !!body?.isProgramAdvisor });
    return send(res, 200, x);
  }

  // Admissions & loans.
  if (path === "/admissions/admin/summary") return send(res, 200, { onboardingQueueCount: db.queue.length, fundraisingCount: db.campaigns.length });
  if (path === "/admissions/admin/onboarding-queue") return cursorPage(res, q, db.queue.filter((x) => !q.stage || x.stage === q.stage));
  if ((r = path.match(/^\/admissions\/admin\/onboarding-queue\/([^/]+)(\/remind)?$/))) {
    const x = db.queue.find((y) => y.studentId === r[1]);
    if (!x) return fail(res, 404, "Not found");
    return r[2] ? send(res, 200, { accepted: true }) : send(res, 200, { ...x, status: "Onboarding", profileSubmittedAt: ago(24 * 4) });
  }
  if (path === "/admissions/admin/fundraising") return cursorPage(res, q, db.campaigns);
  if (path === "/admin/loans") return cursorPage(res, q, db.loans.filter((x) => !q.status || x.status === q.status));
  if ((r = path.match(/^\/admin\/loans\/([^/]+)\/(approve|reject)$/)) && m === "PATCH") {
    const x = db.loans.find((y) => y.id === r[1]);
    if (!x) return fail(res, 404, "Loan not found");
    if (x.status !== "Pending") return fail(res, 409, "Loan is not pending", "CONFLICT");
    x.status = r[2] === "approve" ? "Approved" : "Rejected";
    return send(res, 200, x);
  }
  if ((r = path.match(/^\/loans\/([^/]+)\/repayments$/))) return cursorPage(res, q, []);

  // Talent corner.
  if (path === "/talent-requests/admin/summary") return send(res, 200, { total: db.requests.length, pending: db.requests.filter((x) => x.status === "Pending").length, fulfilled: db.requests.filter((x) => x.status === "Fulfilled").length });
  if (path === "/talent-requests/admin") return cursorPage(res, q, db.requests.filter((x) => !q.status || x.status === q.status));
  if ((r = path.match(/^\/talent-requests\/admin\/([^/]+)(\/fulfill)?$/))) {
    const x = db.requests.find((y) => y.id === r[1]);
    if (!x) return fail(res, 404, "Request not found");
    if (r[2]) Object.assign(x, { status: "Fulfilled", fulfilledAt: new Date().toISOString(), fulfilledBy: { fullName: "Ada Admin", email: "ada.admin@talentcona.test" } });
    return send(res, 200, x);
  }
  if (path === "/talent-pool/admin/summary") return send(res, 200, { totalGraduates: db.talents.length, availableCount: db.talents.filter((t) => t.status === "Available").length, hiredCount: 0, averageFinalGradePercent: 88 });
  if (path === "/talent-pool/admin") return cursorPage(res, q, db.talents);
  if ((r = path.match(/^\/talent-pool\/admin\/([^/]+)$/))) return send(res, 200, db.talents.find((t) => t.id === r[1]) ?? null);

  // Referrals.
  if (path === "/admin/referrals/settings") {
    if (m === "PATCH") {
      const p = body?.rewardPercent;
      if (typeof p !== "number" || p < 0 || p > 100) return fail(res, 400, "rewardPercent must not be greater than 100");
      db.settings = { rewardPercent: p, rewardBps: Math.round(p * 100), updatedAt: new Date().toISOString(), updatedByUserId: "admin-1" };
    }
    return send(res, 200, db.settings);
  }
  if (path === "/admin/referrals/overview") {
    const top = Object.values(db.referrers).sort((a, b) => b.totalEarnedMinor - a.totalEarnedMinor).map((x, i) => ({ rank: i + 1, userId: x.userId, truncatedUserId: x.truncatedUserId, fullName: x.fullName,
      email: x.email, userType: x.userType, totalEarnedMinor: x.totalEarnedMinor, referralCount: x.referrals, paidConversionCount: x.paidConversions, currency: "NGN", minorUnit: 100 }));
    return send(res, 200, { range: q.range || "this_month", currency: "NGN", minorUnit: 100, viralCoefficient: 1.5, conversionValueMinor: 1243000000, totalCommissionsPaidMinor: 2835000, activeReferrers: 342, topReferrers: top });
  }
  if (path === "/admin/referrals/overview/viral-growth") return send(res, 200, series(q.from));
  if (path === "/admin/referrals/overview/leaderboard/export") return file(res, "leaderboard.csv", "Rank,Name\n1,Usman Soliu\n");
  const ledgerFiltered = () => db.ledger.map(ledgerItem).filter((l) => {
    const s = String(q.search || "").toLowerCase();
    const ids = q.programIds ? String(q.programIds).split(",") : [];
    return (!s || [l.referrer.fullName, l.referrer.referralCode, l.referee.fullName, l.programTitle].some((v) => v.toLowerCase().includes(s))) && (!ids.length || ids.includes(l.programId))
      && (!q.status || (q.status === "paid" ? l.ledgerStatus === "Paid" : l.ledgerStatus === "No Commission"));
  });
  if (path === "/admin/referrals/ledger") return cursorPage(res, q, ledgerFiltered());
  if (path === "/admin/referrals/ledger/export") return file(res, "referral-ledger.csv", "Referrer,Program,Status\n" + ledgerFiltered().map((l) => `${l.referrer.fullName},${l.programTitle},${l.ledgerStatus}`).join("\n"));
  if ((r = path.match(/^\/admin\/referrals\/referrers\/([^/]+)(?:\/([a-z-]+))?$/))) {
    const x = db.referrers[r[1]];
    if (!x) return fail(res, 404, "Referrer not found");
    switch (r[2]) {
      case undefined: return send(res, 200, x);
      case "performance": return send(res, 200, series(q.from));
      case "history": return cursorPage(res, q, db.ledger.filter((l) => l.ref === x.userId).map(ledgerItem));
      case "export": return file(res, "referrer-report.xlsx", "PK", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      case "reset-code":
        x.referralCode = `TC${(++db.seq).toString(16).toUpperCase().padStart(8, "0")}`;
        x.shareUrl = `https://staging.talentcona.com/signup?role=student&ref=${x.referralCode}`;
        return send(res, 200, { referralCode: x.referralCode, shareUrl: x.shareUrl });
    }
  }

  // Withdrawals.
  if (path === "/withdrawals/admin") return cursorPage(res, q, db.withdrawals.filter((w) => !q.status || w.status === q.status));
  if (path === "/withdrawals/admin/summary-counts") {
    const c = (st) => db.withdrawals.filter((w) => w.status === st).length;
    return send(res, 200, { all: db.withdrawals.length, pending: c("Pending"), approved: c("Approved"), rejected: c("Rejected"), disbursing: c("Disbursing"), disbursed: c("Disbursed"), failed: c("Failed") });
  }
  if ((r = path.match(/^\/withdrawals\/admin\/users\/([^/]+)\/(payout-summary|requests)$/))) {
    const mine = db.withdrawals.filter((w) => w.userId === r[1]);
    if (r[2] === "requests") return cursorPage(res, q, mine.map(withdrawalSummary));
    const sum = (sts) => mine.filter((w) => sts.includes(w.status)).reduce((t, w) => t + w.amount, 0);
    return send(res, 200, { userId: r[1], availableBalanceMinor: 7160000, pendingBalanceMinor: sum(["Pending", "Approved"]), totalWithdrawnMinor: sum(["Disbursed"]),
      disbursedWithdrawalCount: mine.filter((w) => w.status === "Disbursed").length, currency: "NGN", minorUnit: 100 });
  }
  if ((r = path.match(/^\/withdrawals\/admin\/([^/]+)\/(approve|reject|disburse)$/)) && m === "PATCH") {
    const w = db.withdrawals.find((x) => x.id === r[1]);
    if (!w) return fail(res, 404, "Withdrawal not found");
    const allowed = { approve: ["Pending"], reject: ["Pending"], disburse: ["Approved", "Failed"] }[r[2]];
    if (!allowed.includes(w.status)) return fail(res, 409, `Cannot ${r[2]} a ${w.status} withdrawal`, "CONFLICT");
    if (r[2] === "approve") Object.assign(w, { status: "Approved", reviewedAt: new Date().toISOString() });
    if (r[2] === "reject") Object.assign(w, { status: "Rejected", reviewNote: body?.note ?? null });
    if (r[2] === "disburse") Object.assign(w, { status: "Disbursed", disbursedAt: new Date().toISOString() });
    return send(res, 200, w);
  }
  if ((r = path.match(/^\/withdrawals\/admin\/([^/]+)$/))) {
    const w = db.withdrawals.find((x) => x.id === r[1]);
    if (!w) return fail(res, 404, "Withdrawal not found");
    return send(res, 200, { ...withdrawalSummary(w), bankCode: w.bankCode, note: w.note, reviewNote: w.reviewNote, reviewedAt: w.reviewedAt,
      previousWithdrawalCount: db.withdrawals.filter((x) => x.userId === w.userId && x.status === "Disbursed").length,
      user: { id: w.user.id, fullName: w.user.fullName, email: w.user.email, phoneNumber: w.user.phoneNumber, userType: w.user.userType } });
  }

  return null; // not handled
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://mock");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const m = req.method;
    const raw = m === "GET" || m === "HEAD" ? "" : await new Promise((ok) => {
      let d = "";
      req.on("data", (c) => (d += c));
      req.on("end", () => ok(d));
    });
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }
    const query = {};
    for (const k of new Set(url.searchParams.keys())) {
      const all = url.searchParams.getAll(k);
      query[k] = all.length > 1 ? all : all[0];
    }
    const hook = path.startsWith("/__");
    if (!hook) db.log.push({ method: m, path, query, body });

    // A failure queued by a test (POST /__fail).
    const f = !hook && db.failNext.findIndex((x) => x.method === m && x.path === path);
    if (!hook && f >= 0) {
      const [x] = db.failNext.splice(f, 1);
      return fail(res, x.status ?? 500, x.message ?? "Something went wrong");
    }

    try {
      const handled = await route(req, res, m, path, query, body);
      if (handled === null && !res.headersSent) {
        if (!hook) db.log[db.log.length - 1].unknown = true;
        fail(res, 404, `Mock has no route for ${m} ${path}`, "MOCK_NO_ROUTE");
      }
    } catch (e) {
      console.error(e);
      if (!res.headersSent) fail(res, 500, String(e));
    }
  });
}

// Started directly (Playwright's webServer, or by hand).
if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(PORT, () => console.log(`Mock TalentCona API on http://localhost:${PORT}`));
}
