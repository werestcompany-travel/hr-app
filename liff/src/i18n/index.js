const translations = {
  en: {
    // ── Shared / Components ─────────────────────────────────────────────
    loading: 'Loading...',
    connectingHR: 'Connecting to HR System...',
    loadingHistory: 'Loading your history...',
    loadingBalance: 'Loading leave data...',
    somethingWrong: 'Something went wrong',
    done: 'Done',

    // ── Leave types ──────────────────────────────────────────────────────
    types: {
      sick:      { label: 'Sick Leave',  labelTh: 'ลาป่วย',   desc: 'Same day OK · Cert needed for 2+ days' },
      vacation:  { label: 'Vacation',    labelTh: 'พักร้อน',  desc: '3 days advance notice required' },
      emergency: { label: 'Emergency',   labelTh: 'ลากิจ',    desc: 'Auto-approved immediately' },
      other:     { label: 'Other',       labelTh: 'ลาอื่นๆ',  desc: 'Requires a reason · Normal flow' },
      ot:        { label: 'OT Request',  labelTh: 'ล่วงเวลา' },
    },

    // ── LeaveForm ────────────────────────────────────────────────────────
    leaveRequest: 'Leave Request',
    whatTypeLeave: 'What type of leave?',

    // Dates step
    whenTimeOff: 'When do you need time off?',
    vacationBannerTitle: '⚠️ 3-day advance notice required',
    vacationBannerBody: 'Vacation requires at least 3 days advance notice.',
    sickBannerTitle: 'ℹ️ Sick Leave — no advance notice needed',
    sickBannerBody: 'Medical cert required for 2+ consecutive days.',
    emergencyBannerTitle: '✅ Emergency — auto-approved',
    emergencyBannerBody: 'Emergency leave is auto-approved immediately.',
    startDate: 'START DATE',
    endDate: 'END DATE',
    duration: 'DURATION',
    balance: 'BALANCE',
    day: 'day',
    days: 'days',
    balInsufficient: (bal, diff) => `${bal}d left (−${diff}d)`,
    balSufficient: (bal) => `${bal}d remaining`,
    leaveUsedAfter: 'Leave used after this request',

    // Reason step
    whatIsReason: 'What is the reason?',
    additionalNotes: 'Additional notes',
    medCertRequired: 'A medical certificate is required for 2+ days. You can upload it now or later.',
    reasonPlaceholder: 'Please describe your reason...',
    notesPlaceholder: 'Optional note for your manager...',
    medCert: 'Medical Certificate',
    tapUpload: 'Tap to upload image or PDF',

    // Confirm step
    review: 'Review',
    looksCorrect: 'Does everything look correct?',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    durationLabel: 'Duration',
    reasonLabel: 'Reason',
    certLabel: 'Certificate',
    emergencyNote: '✅ This emergency leave will be auto-approved immediately.',

    // Buttons / alerts
    submitLeave: 'Submit Leave Request',
    submitting: 'Submitting...',
    continue: 'Continue',
    back: '← Back',
    alertEndDate: 'End date must be on or after start date.',
    alertVacationNotice: 'Vacation leave must be requested at least 3 days in advance.',
    alertMedCert: 'A medical certificate is required for 2+ days of sick leave.\n\nSubmit now and upload later?',

    // Success
    leaveSubmittedTitle: 'Leave Request Submitted',
    emergencyApprovedMsg: 'Your emergency leave has been auto-approved.',
    managerNotifiedMsg: 'Your manager has been notified and will review your request shortly.',

    // Balance chips
    sickChip: (n) => `Sick ${n}d`,
    vacationChip: (n) => `Vacation ${n}d`,

    // ── OTForm ───────────────────────────────────────────────────────────
    overtimeRequest: 'Overtime Request',
    otHours: 'OT Hours',
    maxPerMonth: (n) => `Maximum ${n} hours per month`,
    thisMonth: 'THIS MONTH',
    remaining: 'REMAINING',
    hrsUnit: 'hrs',
    afterRequest: (n) => `After this request: ${n} hrs used`,
    exceedsLimit: (n) => `Exceeds monthly limit by ${n} hrs`,
    otDateLabel: 'OT DATE *',
    hoursLabel: 'HOURS *',
    hoursPlaceholder: 'e.g. 2.5',
    reasonOTLabel: 'REASON *',
    reasonOTPlaceholder: 'Why is OT needed?',
    validDateRequired: 'Date is required',
    validHoursRequired: 'Hours is required',
    validMinHours: 'Minimum 0.5 hours',
    validMaxHours: 'Maximum 12 hours per day',
    validReasonRequired: 'Reason is required for OT requests',
    submitOT: 'Submit OT Request',
    alertExceedsLimit: (limit, remaining) =>
      `This would exceed the ${limit}hr monthly limit. You have ${remaining} hours remaining.`,
    otSubmittedTitle: 'OT Request Submitted',
    otSubmittedMsg: 'Your manager has been notified and will review your request shortly.',

    // ── History ──────────────────────────────────────────────────────────
    myRequests: 'My Requests',
    requestHistory: 'Request History',
    filterAll: 'All',
    filterPending: 'Pending',
    filterApproved: 'Approved',
    filterRejected: 'Rejected',
    noRequests: 'No requests found',
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusCancelled: 'Cancelled',
    detailReason: 'Reason',
    detailRejectionReason: 'Rejection reason',
    detailReviewedBy: 'Reviewed by',
    detailReviewed: 'Reviewed',
    detailSubmitted: 'Submitted',

    // ── Balance ──────────────────────────────────────────────────────────
    balanceSectionLabel: 'Leave Balance',
    leaveBalance: (year) => `Leave Balance ${year}`,
    entitlement: 'Entitlement',
    used: 'Used',
    daysRemaining: 'Remaining',
    daysUnit: 'days',
    usedOf: (n) => `${n} used`,
    remainingOf: (n) => `${n} remaining`,
    pendingSection: 'Awaiting Approval',
    approvedSection: (n) => `Approved this year (${n})`,
    pendingBadge: 'Pending',
    approvedBadge: 'Approved',

    // ── RejectForm ───────────────────────────────────────────────────────
    managerAction: 'Manager Action',
    rejectRequest: 'Reject Request',
    rejectSubtitle: 'The employee will receive your reason via LINE.',
    cannotBeUndone: 'This action cannot be undone',
    notifiedImmediately: 'The employee will be notified immediately once you submit.',
    rejectionReasonLabel: 'REJECTION REASON',
    rejectionPlaceholder: 'Please explain why this request is being rejected...',
    charMin: (n) => `${n} / 10`,
    validReasonRejectRequired: 'Reason is required',
    validReasonRejectMin: 'Please provide more detail (min 10 characters)',
    confirmRejection: 'Confirm Rejection',
    cancel: 'Cancel',
    invalidUrl: 'Invalid URL. Missing stepId parameter. Please use the Reject button in LINE.',
    rejectSuccessTitle: 'Request Rejected',
    rejectSuccessMsg: 'The employee has been notified with your reason.',
  },

  // ────────────────────────────────────────────────────────────────────────
  th: {
    // ── Shared / Components ─────────────────────────────────────────────
    loading: 'กำลังโหลด...',
    connectingHR: 'กำลังเชื่อมต่อระบบ HR...',
    loadingHistory: 'กำลังโหลดประวัติการลา...',
    loadingBalance: 'กำลังโหลดข้อมูลการลา...',
    somethingWrong: 'เกิดข้อผิดพลาด',
    done: 'เสร็จสิ้น',

    // ── Leave types ──────────────────────────────────────────────────────
    types: {
      sick:      { label: 'ลาป่วย',   labelTh: 'Sick Leave',  desc: 'ลาได้ทันที · ต้องมีใบรับรองแพทย์ถ้าลา 2 วันขึ้นไป' },
      vacation:  { label: 'พักร้อน',  labelTh: 'Vacation',    desc: 'ต้องแจ้งล่วงหน้าอย่างน้อย 3 วัน' },
      emergency: { label: 'ลากิจ',    labelTh: 'Emergency',   desc: 'อนุมัติอัตโนมัติทันที' },
      other:     { label: 'ลาอื่นๆ',  labelTh: 'Other',       desc: 'ต้องระบุเหตุผล · ผ่านขั้นตอนปกติ' },
      ot:        { label: 'ล่วงเวลา', labelTh: 'OT Request' },
    },

    // ── LeaveForm ────────────────────────────────────────────────────────
    leaveRequest: 'คำขอลา',
    whatTypeLeave: 'ต้องการลาประเภทใด?',

    // Dates step
    whenTimeOff: 'ต้องการลาวันไหน?',
    vacationBannerTitle: '⚠️ ต้องแจ้งล่วงหน้า 3 วัน',
    vacationBannerBody: 'การลาพักร้อนต้องแจ้งล่วงหน้าอย่างน้อย 3 วัน',
    sickBannerTitle: 'ℹ️ ลาป่วย — ไม่ต้องแจ้งล่วงหน้า',
    sickBannerBody: 'ต้องมีใบรับรองแพทย์หากลา 2 วันติดต่อกันขึ้นไป',
    emergencyBannerTitle: '✅ ลากิจ — อนุมัติอัตโนมัติ',
    emergencyBannerBody: 'การลากิจจะได้รับการอนุมัติทันที',
    startDate: 'วันที่เริ่มลา',
    endDate: 'วันที่สิ้นสุด',
    duration: 'จำนวนวัน',
    balance: 'วันลาคงเหลือ',
    day: 'วัน',
    days: 'วัน',
    balInsufficient: (bal, diff) => `เหลือ ${bal} วัน (ขาด ${diff} วัน)`,
    balSufficient: (bal) => `เหลือ ${bal} วัน`,
    leaveUsedAfter: 'วันลาที่จะใช้หลังยื่นคำขอ',

    // Reason step
    whatIsReason: 'ระบุเหตุผลการลา',
    additionalNotes: 'หมายเหตุเพิ่มเติม',
    medCertRequired: 'ต้องมีใบรับรองแพทย์สำหรับการลาป่วย 2 วันขึ้นไป สามารถแนบภายหลังได้',
    reasonPlaceholder: 'กรุณาระบุเหตุผลการลา...',
    notesPlaceholder: 'หมายเหตุถึงผู้จัดการ (ถ้ามี)...',
    medCert: 'ใบรับรองแพทย์',
    tapUpload: 'แตะเพื่ออัปโหลดรูปภาพหรือ PDF',

    // Confirm step
    review: 'ตรวจสอบข้อมูล',
    looksCorrect: 'ข้อมูลถูกต้องทั้งหมดหรือไม่?',
    startDateLabel: 'วันที่เริ่มต้น',
    endDateLabel: 'วันที่สิ้นสุด',
    durationLabel: 'จำนวนวัน',
    reasonLabel: 'เหตุผล',
    certLabel: 'ใบรับรองแพทย์',
    emergencyNote: '✅ การลากิจนี้จะได้รับการอนุมัติทันที',

    // Buttons / alerts
    submitLeave: 'ยื่นคำขอลา',
    submitting: 'กำลังส่ง...',
    continue: 'ถัดไป',
    back: '← ย้อนกลับ',
    alertEndDate: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น',
    alertVacationNotice: 'การลาพักร้อนต้องแจ้งล่วงหน้าอย่างน้อย 3 วัน',
    alertMedCert: 'ต้องมีใบรับรองแพทย์สำหรับการลาป่วย 2 วันขึ้นไป\n\nยื่นตอนนี้แล้วแนบใบรับรองทีหลังได้?',

    // Success
    leaveSubmittedTitle: 'ส่งคำขอลาสำเร็จ',
    emergencyApprovedMsg: 'การลากิจของคุณได้รับการอนุมัติอัตโนมัติแล้ว',
    managerNotifiedMsg: 'ผู้จัดการของคุณได้รับแจ้งและจะพิจารณาคำขอโดยเร็ว',

    // Balance chips
    sickChip: (n) => `ป่วย ${n}วัน`,
    vacationChip: (n) => `พักร้อน ${n}วัน`,

    // ── OTForm ───────────────────────────────────────────────────────────
    overtimeRequest: 'คำขอทำงานล่วงเวลา',
    otHours: 'ชั่วโมง OT',
    maxPerMonth: (n) => `สูงสุด ${n} ชั่วโมงต่อเดือน`,
    thisMonth: 'เดือนนี้',
    remaining: 'คงเหลือ',
    hrsUnit: 'ชม.',
    afterRequest: (n) => `หลังยื่นคำขอ: ใช้ไป ${n} ชม.`,
    exceedsLimit: (n) => `เกินขีดจำกัดรายเดือน ${n} ชม.`,
    otDateLabel: 'วันที่ทำ OT *',
    hoursLabel: 'จำนวนชั่วโมง *',
    hoursPlaceholder: 'เช่น 2.5',
    reasonOTLabel: 'เหตุผล *',
    reasonOTPlaceholder: 'เหตุผลที่ต้องทำงานล่วงเวลา?',
    validDateRequired: 'กรุณาระบุวันที่',
    validHoursRequired: 'กรุณาระบุจำนวนชั่วโมง',
    validMinHours: 'ขั้นต่ำ 0.5 ชั่วโมง',
    validMaxHours: 'สูงสุด 12 ชั่วโมงต่อวัน',
    validReasonRequired: 'กรุณาระบุเหตุผลสำหรับการทำ OT',
    submitOT: 'ยื่นคำขอ OT',
    alertExceedsLimit: (limit, remaining) =>
      `จะเกินขีดจำกัด ${limit} ชม./เดือน คุณมีโควตาเหลือ ${remaining} ชม.`,
    otSubmittedTitle: 'ส่งคำขอ OT สำเร็จ',
    otSubmittedMsg: 'ผู้จัดการของคุณได้รับแจ้งและจะพิจารณาคำขอโดยเร็ว',

    // ── History ──────────────────────────────────────────────────────────
    myRequests: 'คำขอของฉัน',
    requestHistory: 'ประวัติการลา',
    filterAll: 'ทั้งหมด',
    filterPending: 'รออนุมัติ',
    filterApproved: 'อนุมัติแล้ว',
    filterRejected: 'ไม่อนุมัติ',
    noRequests: 'ไม่พบรายการ',
    statusPending: 'รออนุมัติ',
    statusApproved: 'อนุมัติแล้ว',
    statusRejected: 'ไม่อนุมัติ',
    statusCancelled: 'ยกเลิก',
    detailReason: 'เหตุผล',
    detailRejectionReason: 'เหตุผลที่ไม่อนุมัติ',
    detailReviewedBy: 'ผู้พิจารณา',
    detailReviewed: 'วันที่พิจารณา',
    detailSubmitted: 'วันที่ยื่น',

    // ── Balance ──────────────────────────────────────────────────────────
    balanceSectionLabel: 'วันลาคงเหลือ',
    leaveBalance: (year) => `วันลาคงเหลือ ปี ${year}`,
    entitlement: 'สิทธิ์',
    used: 'ใช้แล้ว',
    daysRemaining: 'คงเหลือ',
    daysUnit: 'วัน',
    usedOf: (n) => `ใช้ไป ${n} วัน`,
    remainingOf: (n) => `เหลือ ${n} วัน`,
    pendingSection: 'รออนุมัติ',
    approvedSection: (n) => `อนุมัติแล้วปีนี้ (${n} รายการ)`,
    pendingBadge: 'รออนุมัติ',
    approvedBadge: 'อนุมัติ',

    // ── RejectForm ───────────────────────────────────────────────────────
    managerAction: 'การดำเนินการของผู้จัดการ',
    rejectRequest: 'ไม่อนุมัติคำขอ',
    rejectSubtitle: 'พนักงานจะได้รับแจ้งเหตุผลผ่าน LINE',
    cannotBeUndone: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
    notifiedImmediately: 'พนักงานจะได้รับการแจ้งเตือนทันทีหลังจากคุณส่ง',
    rejectionReasonLabel: 'เหตุผลที่ไม่อนุมัติ',
    rejectionPlaceholder: 'กรุณาระบุเหตุผลที่ไม่อนุมัติคำขอนี้...',
    charMin: (n) => `${n} / 10`,
    validReasonRejectRequired: 'กรุณาระบุเหตุผล',
    validReasonRejectMin: 'กรุณาระบุรายละเอียดเพิ่มเติม (ขั้นต่ำ 10 ตัวอักษร)',
    confirmRejection: 'ยืนยันการไม่อนุมัติ',
    cancel: 'ยกเลิก',
    invalidUrl: 'URL ไม่ถูกต้อง ไม่พบ stepId กรุณากดปุ่ม Reject ใน LINE',
    rejectSuccessTitle: 'ไม่อนุมัติคำขอแล้ว',
    rejectSuccessMsg: 'พนักงานได้รับแจ้งเหตุผลของคุณแล้ว',
  },
};

export default translations;
