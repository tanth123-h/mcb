/**
 * lib/i18n.tsx — EN/TH translation context
 */
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'th';

export const translations = {
  en: {
    // Nav
    nav_mcb: '◄ MCB',
    nav_lore: 'LORE',
    nav_incident: 'INCIDENT',
    nav_apply: 'APPLY',
    nav_access: 'ACCESS',
    nav_profile: 'PROFILE',
    nav_tasks: 'TASKS',
    nav_taskops: 'TASK OPS',
    nav_logout: 'LOGOUT',
    // Layout
    sys_status: 'MCB-SYS v4.2.1 // RESTRICTED ACCESS',
    uplink: '■ UPLINK STABLE',
    enc: 'ENC: AES-256',
    footer_left: 'MOONFALL CONTAINMENT BUREAU // INTERNAL USE ONLY',
    footer_right: 'CLASSIFICATION: TOP SECRET',
    // Landing
    classified_transmission: '⚠ CLASSIFIED TRANSMISSION',
    moonfall: 'MOONFALL',
    incident: 'INCIDENT',
    day0: 'DAY 0',
    global_authority: 'MOONFALL CONTAINMENT BUREAU // GLOBAL AUTHORITY',
    incident_report: 'FILE: INCIDENT-REPORT-001 // CLEARANCE LEVEL: OMEGA',
    incident_body1: 'On Day 0, the Moon left its orbit. Standard physics did not apply. There was no extinction event — only something',
    far_worse: 'far worse',
    incident_body2: '. What emerged from the impact site defied every model, every simulation, every assumption we had about the boundaries of the natural world.',
    incident_body3: 'The Bureau was formed in the weeks that followed. Not to save the world —',
    to_contain: 'to contain it.',
    btn_access_files: '▶ ACCESS CLASSIFIED FILES',
    btn_incident_log: 'INCIDENT LOG',
    btn_apply: 'APPLY',
    btn_personnel: 'PERSONNEL',
    sys_integrity: 'SYS INTEGRITY',
    stable: 'STABLE',
    containment_wall: 'CONTAINMENT WALL',
    holding: 'HOLDING',
    threat_level: 'THREAT LEVEL',
    critical: 'CRITICAL',
    // Access page
    restricted_terminal: 'Restricted Access Terminal',
    enter_credentials: 'Enter your bureau credentials. Issued upon acceptance only.',
    credential_verification: 'CREDENTIAL VERIFICATION',
    label_codename: 'CODENAME',
    label_access_key: 'ACCESS KEY',
    placeholder_codename: 'e.g. BLACKOUT',
    placeholder_password: 'Bureau-issued password',
    btn_request_access: '▶ REQUEST ACCESS',
    scanning: '▌ SCANNING...',
    creds_invalid: 'CREDENTIALS INVALID — Record not found or access denied.',
    try_again: 'Try again',
    creds_note1: 'Credentials are issued by bureau administration upon acceptance.',
    creds_note2: 'Pending or rejected applicants have',
    creds_note2b: 'no access',
    not_operative: 'Not yet a bureau operative?',
    submit_application: 'Submit Application',
    // Apply page
    form_header: 'FORM-MCB-APP-002 // CLASSIFICATION: RESTRICTED',
    form_warning: 'All fields marked with * are mandatory. False declarations will result in immediate disqualification.',
    section_identity: '01 — IDENTITY',
    section_assignment: '02 — DESIRED ASSIGNMENT',
    section_background: '03 — BACKGROUND DISCLOSURE',
    label_full_name: 'Full Name *',
    label_codename_field: 'Codename *',
    hint_codename: 'Unique identifier. Uppercase, no spaces.',
    label_age: 'Age *',
    label_nationality: 'Nationality *',
    label_role: 'Role Applied *',
    label_background: 'Background Story *',
    hint_background: 'Minimum 50 characters. Previous experience, special circumstances, clearance history.',
    label_skills: 'Skills *',
    hint_skills: 'Comma-separated. e.g. Demolitions, Tactical Analysis, Field Medicine',
    label_notes: 'Additional Notes',
    hint_notes: 'Optional.',
    label_attach: 'Attach Identification / Evidence',
    btn_submit_app: '▶ SUBMIT APPLICATION',
    submitting: '▌ SUBMITTING TO BUREAU...',
    directive_agree: 'By submitting, you agree to Bureau Directive 7-A and consent to full background vetting.',
    app_success_title: 'APPLICATION SUBMITTED',
    app_success_subtitle: 'INTAKE PROCESSING',
    transmission_received: 'TRANSMISSION RECEIVED',
    application_logged: 'Application Logged',
    app_pending_note: 'is pending bureau review.',
    app_status_pending: 'Application status:',
    app_review_window: '> Estimated review window: 24–72 hours',
    app_no_duplicate: '> Do not resubmit duplicate applications',
    btn_return_terminal: '← RETURN TO MAIN TERMINAL',
    // Tasks
    task_board: 'TASK BOARD',
    loading_assignments: 'Loading assignments...',
    no_directives: 'No active directives assigned.',
    await_command: 'Await bureau command for new research tasks or field missions.',
    btn_mark_progress: 'MARK IN PROGRESS',
    btn_submit_report: 'SUBMIT REPORT',
    btn_view_submission: 'VIEW SUBMISSION',
    syncing: 'SYNCING...',
    assigned_by: 'ASSIGNED BY',
    deadline: 'Deadline:',
    open_deadline: 'OPEN',
    task_id: 'Task ID:',
    admin_feedback: 'ADMIN FEEDBACK',
    // Submit report
    submit_report_title: 'SUBMIT REPORT',
    submit_report_subtitle: 'TASK COMPLETION DOSSIER',
    decrypting_task: 'Decrypting task file...',
    report_submission: 'REPORT SUBMISSION',
    label_report_title: 'Report Title',
    label_findings: 'Findings / Summary',
    label_actions: 'Actions Taken',
    label_result: 'Result',
    label_report_notes: 'Notes',
    label_proof_image: 'Proof Image (Optional)',
    last_feedback: 'LAST REVIEW FEEDBACK',
    btn_submit: '▶ SUBMIT REPORT',
    btn_uplinking: 'UPLINKING...',
    btn_return: 'RETURN',
    // Profile
    status_banner: 'Status Banner',
    status_log: 'STATUS LOG',
    record_created: 'Personnel record created',
    status_assigned: 'Status assigned:',
    status_changed: 'Status changed to',
    details_redacted: '— details redacted',
    squad_section: 'SQUAD',
    application_record: 'APPLICATION RECORD',
    label_role_applied: 'ROLE APPLIED',
    label_app_status: 'APPLICATION STATUS',
    label_bg_story: 'BACKGROUND STORY',
    label_app_skills: 'SKILLS',
    label_app_notes: 'NOTES',
    own_file_note1: '▶ You are viewing your own personnel file.',
    own_file_note2: 'Some information may be redacted per clearance level.',
    live_update: '● LIVE UPDATE',
    record_not_found: 'RECORD NOT FOUND',
    record_error_desc: 'could not be located.',
    record_purged: 'The record may have been purged, archived, or the ID is incorrect.',
    btn_return_back: '← RETURN',
    // Lore
    lore_title: 'CLASSIFIED FILES',
    lore_subtitle: '// BUREAU ARCHIVE — CLEARANCE REQUIRED',
    warning_unauthorized: 'WARNING: Unauthorized access to these files is a violation of Bureau Directive 12-F. All access attempts are logged and traced. You have been identified.',
    timeline_title: 'INCIDENT TIMELINE — MOONFALL EVENT',
    documents_title: 'BUREAU DOCUMENTS — RESTRICTED ARCHIVE',
    end_public_archive: 'END OF PUBLIC ARCHIVE',
    lore_cta1: 'You are applying to a classified global organization.',
    lore_cta2: 'The Bureau does not forget. The Bureau does not forgive mistakes.',
    btn_proceed_application: '▶ PROCEED TO APPLICATION',
    btn_view_incident: 'VIEW INCIDENT VISUALIZATION',
    // Common
    description: 'Description',
    objective: 'Objective',
    unassigned: 'UNASSIGNED',
    lang_toggle: 'TH',
  },
  th: {
    // Nav
    nav_mcb: '◄ MCB',
    nav_lore: 'เรื่องราว',
    nav_incident: 'เหตุการณ์',
    nav_apply: 'สมัคร',
    nav_access: 'เข้าสู่ระบบ',
    nav_profile: 'โปรไฟล์',
    nav_tasks: 'ภารกิจ',
    nav_taskops: 'ปฏิบัติการ',
    nav_logout: 'ออกจากระบบ',
    // Layout
    sys_status: 'MCB-SYS v4.2.1 // การเข้าถึงถูกจำกัด',
    uplink: '■ เชื่อมต่อสำเร็จ',
    enc: 'เข้ารหัส: AES-256',
    footer_left: 'สำนักงานควบคุมมูนฟอล // ใช้ภายในเท่านั้น',
    footer_right: 'การจำแนก: ลับสุดยอด',
    // Landing
    classified_transmission: '⚠ สัญญาณลับ',
    moonfall: 'มูนฟอล',
    incident: 'เหตุการณ์',
    day0: 'วันที่ 0',
    global_authority: 'สำนักงานควบคุมมูนฟอล // อำนาจระดับโลก',
    incident_report: 'ไฟล์: รายงานเหตุการณ์-001 // ระดับการเข้าถึง: โอเมก้า',
    incident_body1: 'วันที่ 0 ดวงจันทร์ออกจากวงโคจร กฎฟิสิกส์ปกติใช้ไม่ได้ ไม่มีการสูญพันธุ์ — มีแต่สิ่งที่',
    far_worse: 'เลวร้ายกว่านั้นมาก',
    incident_body2: ' สิ่งที่โผล่ออกมาจากจุดกระทบขัดแย้งกับทุกโมเดล ทุกการจำลอง ทุกสมมติฐานที่เรามีเกี่ยวกับขอบเขตของโลกธรรมชาติ',
    incident_body3: 'สำนักงานถูกจัดตั้งในช่วงสัปดาห์ต่อมา ไม่ใช่เพื่อช่วยโลก —',
    to_contain: 'แต่เพื่อควบคุมมัน',
    btn_access_files: '▶ เข้าถึงไฟล์ลับ',
    btn_incident_log: 'บันทึกเหตุการณ์',
    btn_apply: 'สมัครงาน',
    btn_personnel: 'บุคลากร',
    sys_integrity: 'ความสมบูรณ์ระบบ',
    stable: 'เสถียร',
    containment_wall: 'กำแพงควบคุม',
    holding: 'ยังคงอยู่',
    threat_level: 'ระดับภัยคุกคาม',
    critical: 'วิกฤต',
    // Access page
    restricted_terminal: 'เทอร์มินัลการเข้าถึงจำกัด',
    enter_credentials: 'ป้อนข้อมูลรับรองของสำนักงาน ออกให้เมื่อได้รับการยอมรับเท่านั้น',
    credential_verification: 'การตรวจสอบข้อมูลรับรอง',
    label_codename: 'ชื่อรหัส',
    label_access_key: 'กุญแจเข้าถึง',
    placeholder_codename: 'เช่น BLACKOUT',
    placeholder_password: 'รหัสผ่านที่สำนักงานออกให้',
    btn_request_access: '▶ ขอเข้าถึง',
    scanning: '▌ กำลังสแกน...',
    creds_invalid: 'ข้อมูลรับรองไม่ถูกต้อง — ไม่พบระเบียนหรือการเข้าถึงถูกปฏิเสธ',
    try_again: 'ลองอีกครั้ง',
    creds_note1: 'ข้อมูลรับรองออกให้โดยการบริหารสำนักงานเมื่อได้รับการยอมรับ',
    creds_note2: 'ผู้สมัครที่รอการพิจารณาหรือถูกปฏิเสธ',
    creds_note2b: 'ไม่มีสิทธิ์เข้าถึง',
    not_operative: 'ยังไม่ได้เป็นเจ้าหน้าที่?',
    submit_application: 'ยื่นใบสมัคร',
    // Apply page
    form_header: 'แบบฟอร์ม-MCB-APP-002 // การจำแนก: จำกัด',
    form_warning: 'ฟิลด์ที่มีเครื่องหมาย * เป็นข้อมูลบังคับ การแจ้งข้อมูลเท็จจะถูกตัดสิทธิ์ทันที',
    section_identity: '01 — ตัวตน',
    section_assignment: '02 — การมอบหมายที่ต้องการ',
    section_background: '03 — การเปิดเผยภูมิหลัง',
    label_full_name: 'ชื่อเต็ม *',
    label_codename_field: 'ชื่อรหัส *',
    hint_codename: 'ตัวระบุเฉพาะ ตัวพิมพ์ใหญ่ ไม่มีช่องว่าง',
    label_age: 'อายุ *',
    label_nationality: 'สัญชาติ *',
    label_role: 'ตำแหน่งที่สมัคร *',
    label_background: 'ประวัติ *',
    hint_background: 'ขั้นต่ำ 50 ตัวอักษร ประสบการณ์ก่อนหน้า สถานการณ์พิเศษ ประวัติการเข้าถึง',
    label_skills: 'ทักษะ *',
    hint_skills: 'คั่นด้วยจุลภาค เช่น วัตถุระเบิด การวิเคราะห์เชิงยุทธวิธี การแพทย์ภาคสนาม',
    label_notes: 'หมายเหตุเพิ่มเติม',
    hint_notes: 'ไม่บังคับ',
    label_attach: 'แนบหลักฐานตัวตน / หลักฐาน',
    btn_submit_app: '▶ ยื่นใบสมัคร',
    submitting: '▌ กำลังส่งไปยังสำนักงาน...',
    directive_agree: 'เมื่อส่ง คุณยอมรับคำสั่งสำนักงาน 7-A และยินยอมให้ตรวจสอบประวัติอย่างครบถ้วน',
    app_success_title: 'ยื่นใบสมัครแล้ว',
    app_success_subtitle: 'กำลังดำเนินการรับเข้า',
    transmission_received: 'ได้รับการส่งข้อมูลแล้ว',
    application_logged: 'บันทึกใบสมัครแล้ว',
    app_pending_note: 'รอการพิจารณาจากสำนักงาน',
    app_status_pending: 'สถานะใบสมัคร:',
    app_review_window: '> ระยะเวลาพิจารณาโดยประมาณ: 24–72 ชั่วโมง',
    app_no_duplicate: '> อย่ายื่นใบสมัครซ้ำ',
    btn_return_terminal: '← กลับสู่เทอร์มินัลหลัก',
    // Tasks
    task_board: 'กระดานภารกิจ',
    loading_assignments: 'กำลังโหลดการมอบหมาย...',
    no_directives: 'ไม่มีคำสั่งที่ใช้งานอยู่',
    await_command: 'รอคำสั่งจากสำนักงานสำหรับภารกิจวิจัยหรือภาคสนาม',
    btn_mark_progress: 'ทำเครื่องหมายกำลังดำเนินการ',
    btn_submit_report: 'ส่งรายงาน',
    btn_view_submission: 'ดูการส่ง',
    syncing: 'กำลังซิงค์...',
    assigned_by: 'มอบหมายโดย',
    deadline: 'กำหนดส่ง:',
    open_deadline: 'เปิด',
    task_id: 'รหัสภารกิจ:',
    admin_feedback: 'ความคิดเห็นแอดมิน',
    // Submit report
    submit_report_title: 'ส่งรายงาน',
    submit_report_subtitle: 'แฟ้มสรุปการปฏิบัติภารกิจ',
    decrypting_task: 'กำลังถอดรหัสไฟล์ภารกิจ...',
    report_submission: 'การส่งรายงาน',
    label_report_title: 'ชื่อรายงาน',
    label_findings: 'ผลการค้นพบ / สรุป',
    label_actions: 'การดำเนินการที่ทำ',
    label_result: 'ผลลัพธ์',
    label_report_notes: 'หมายเหตุ',
    label_proof_image: 'ภาพหลักฐาน (ไม่บังคับ)',
    last_feedback: 'ความคิดเห็นการตรวจสอบล่าสุด',
    btn_submit: '▶ ส่งรายงาน',
    btn_uplinking: 'กำลังอัปโหลด...',
    btn_return: 'กลับ',
    // Profile
    status_banner: 'แบนเนอร์สถานะ',
    status_log: 'บันทึกสถานะ',
    record_created: 'สร้างระเบียนบุคลากรแล้ว',
    status_assigned: 'กำหนดสถานะ:',
    status_changed: 'สถานะเปลี่ยนเป็น',
    details_redacted: '— รายละเอียดถูกลบ',
    squad_section: 'หน่วย',
    application_record: 'ระเบียนใบสมัคร',
    label_role_applied: 'ตำแหน่งที่สมัคร',
    label_app_status: 'สถานะใบสมัคร',
    label_bg_story: 'ประวัติส่วนตัว',
    label_app_skills: 'ทักษะ',
    label_app_notes: 'หมายเหตุ',
    own_file_note1: '▶ คุณกำลังดูไฟล์บุคลากรของตัวเอง',
    own_file_note2: 'ข้อมูลบางอย่างอาจถูกลบตามระดับการเข้าถึง',
    live_update: '● อัปเดตสด',
    record_not_found: 'ไม่พบระเบียน',
    record_error_desc: 'ไม่พบ',
    record_purged: 'ระเบียนอาจถูกลบ เก็บถาวร หรือรหัสไม่ถูกต้อง',
    btn_return_back: '← กลับ',
    // Lore
    lore_title: 'ไฟล์ลับ',
    lore_subtitle: '// คลังสำนักงาน — ต้องมีการเข้าถึง',
    warning_unauthorized: 'คำเตือน: การเข้าถึงไฟล์เหล่านี้โดยไม่ได้รับอนุญาตถือเป็นการละเมิดคำสั่งสำนักงาน 12-F ความพยายามเข้าถึงทั้งหมดถูกบันทึกและติดตาม คุณได้รับการระบุตัวตนแล้ว',
    timeline_title: 'ลำดับเวลาเหตุการณ์ — เหตุการณ์มูนฟอล',
    documents_title: 'เอกสารสำนักงาน — คลังจำกัด',
    end_public_archive: 'สิ้นสุดคลังสาธารณะ',
    lore_cta1: 'คุณกำลังสมัครเข้าองค์กรลับระดับโลก',
    lore_cta2: 'สำนักงานไม่เคยลืม สำนักงานไม่ยกโทษความผิดพลาด',
    btn_proceed_application: '▶ ดำเนินการสมัคร',
    btn_view_incident: 'ดูการแสดงผลเหตุการณ์',
    // Common
    description: 'คำอธิบาย',
    objective: 'วัตถุประสงค์',
    unassigned: 'ไม่ได้รับมอบหมาย',
    lang_toggle: 'EN',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  t: (key) => translations.en[key],
  toggleLang: () => {},
});

const LANG_KEY = 'mcb_lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === 'en' || stored === 'th') setLang(stored);
  }, []);

  function toggleLang() {
    setLang(prev => {
      const next: Lang = prev === 'en' ? 'th' : 'en';
      localStorage.setItem(LANG_KEY, next);
      return next;
    });
  }

  const t = (key: TranslationKey): string => translations[lang][key] ?? translations.en[key];

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
