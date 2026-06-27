// ====================================================================
// School Connect — Site Config (auto-generated)
// Replace the URL and anon key below with your Supabase project values.
// ====================================================================
window.SUPABASE_URL = 'https://dgarrlzbmscpgtefdupm.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYXJybHpibXNjcGd0ZWZkdXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzc0MTYsImV4cCI6MjA5NzkxMzQxNn0.7CNB3KcQD3NHr6ENDGb7gRX_ld_xjgpQeL_YVuLRW_A';
window.SCHOOL = {
  name:    'God of Seed Academy',
  short:   'GOSA',
  motto:   'Excellence in Learning and Character',
  currency:'₦',
  phone:   '2348088667076',
  email:   'godofseedacademy@gmail.com',
  address: '63B, Ishaga Abosule Street, Agbado Crossing, Ogun State',
  campuses:["Main Campus"],
  theme:   'theme14',
  font:    'fjallaone',
  fontFamily: 'Fjalla One',
  fontCss: 'Fjalla+One',
  layout:  'layout1',
  modules: ["academic_setup","students","staff","classes","subjects","attendance","cbt-prompts","entrance","results","certificates","flyer","report-cards","analytics","admin-data","academic_records","storage","approvals","timetable-generator","checkin","diary","surveys","menu","settings","fees","timetable","cbt","sow","messages","announcements","events","gallery","library","digital_library","assignments","parents","idcards","directory","departments","broadcast","complaints","leave","visitors","developer","conduct","health","promotion","lms","gamification","career_counseling","lesson_plans","behaviour","support_plans","substitutions","hr","admissions","payroll","staff_loans","staff_bonus","appraisals","hostel","alumni","inventory","document_builder","fleet_tracking","facility_booking","compliance","activity_log","voting","parent_meeting","front_desk","helpdesk","eresources","school_calendar","lost_found","book_request","finance","cafeteria","transport","financial_aid","donations","payments_online","rubrics","transcripts","transfer_cert","counselling"],
  levels:  ["JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"],
  hmgLink: 'https://hmgconcepts.pages.dev/',
  logoExt: 'png',
  primary: '#1036f8',
  accent:  '#79c51d'
};

// Build the supabase client
const sb = (window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

console.log('%c[God of Seed Academy] School Connect ready.', 'color:#1036f8;font-weight:bold;font-size:13px');
