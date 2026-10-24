
(function(){
"use strict";
const K="lavsms-demo-records",A="lavsms-academic-suite-v2",T="lavsms-attendance-history-v1";
const $=id=>document.getElementById(id);
const esc=x=>String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const read=(key,backup)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):backup}catch(e){return backup}};
const save=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val));return true}catch(e){alert("Browser storage is full. Could not save demo records.");return false}};
const localDay=()=>{let d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const samples=[["Mrs. Meera Kulkarni","Mathematics"],["Mr. Rahul Deshmukh","Science"],["Ms. Neha Shah","English"],["Mr. Amit Jadhav","Social Science"],["Mrs. Kavita Pawar","Marathi"],["Mr. Sandeep More","Computer"]];
const demoNames=["Aarav","Ananya","Vihaan","Saanvi","Aditya","Aadhya","Arjun","Isha","Reyansh","Myra","Atharv","Kavya","Vivaan","Diya","Advait","Sara","Ishaan","Riya","Shaurya","Aanya","Kabir","Pari","Rudra","Meera","Om","Tanvi","Dhruv","Nitya","Vedant","Siya"];
const demoLast=["Patil","Shah","Joshi","Deshmukh","Kulkarni","Jadhav","Pawar","More","Shinde","Chavan","Gaikwad","Bhosale","Kadam","Mane","Sawant","Naik","Gokhale","Apte","Nair","Mehta","Gupta","Suryawanshi","Salunkhe","Ingale","Wagh","Thakur","Khot","Pathak","Patwardhan","Dandekar"];
let teacherName="",tab="overview",chosen="",when=localDay(),period="1",subject="",marksMap={},q="";
function students(){
 const d=read(K,null);
 if(d&&Array.isArray(d.Students))return d.Students;
 // Mirror the admin demo's deterministic student roster, so record IDs match.
 const all=[],sections=["A","B","C","D"];
 sections.forEach((section,sectionIndex)=>{
  for(let i=0;i<30;i++){
   const first=demoNames[(i+sectionIndex*8)%demoNames.length];
   const last=demoLast[(i*7+sectionIndex*9)%demoLast.length];
   const number=String(i+1).padStart(3,"0");
   all.push({id:"demo-"+section+"-"+number,admissionNo:"LAV-"+section+"-"+number,name:first+" "+last,grade:"Class 8",section,parent:"Demo parent "+number,phone:"",email:"",detail:"Class 8 · "+section,status:"Active",demoRoster:true});
  }
 });
 return all;
}
function academic(){
 let d=read(A,null);
 if(d&&d.version===2&&Array.isArray(d.classes)&&Array.isArray(d.timetable)&&Array.isArray(d.exams)&&Array.isArray(d.marks))return d;
 // Same first-visit demo curriculum and teacher assignments as the admin.
 const demoAssignments=[
  ["Class 8","A","Mrs. Meera Kulkarni","Mathematics","101"],
  ["Class 8","B","Mr. Rahul Deshmukh","Science","102"],
  ["Class 8","C","Ms. Neha Shah","English","103"],
  ["Class 8","D","Mr. Amit Jadhav","Social Science","104"],
  ["Class 7","A","Mrs. Kavita Pawar","Marathi","105"],
  ["Class 6","A","Mr. Sandeep More","Computer","106"]
 ];
 const cls=[];
 ["Nursery","Junior KG","Senior KG",...Array.from({length:10},(_,i)=>"Class "+(i+1))].forEach(name=>{
  (name==="Class 8"?["A","B","C","D"]:["A"]).forEach(section=>{
   const match=demoAssignments.find(a=>a[0]===name&&a[1]===section);
   cls.push({id:"default-"+name.replace(/\s/g,"")+"-"+section,name,section,teacher:match?.[2]||"",room:match?.[4]||"",status:"Active"});
  });
 });
 const tt=[];
 ["Monday","Tuesday","Wednesday","Thursday","Friday"].forEach(day=>{
  demoAssignments.forEach(a=>tt.push({id:"sample-"+day+"-"+a[0].replace(/\s/g,"")+"-"+a[1],day,grade:a[0],section:a[1],period:"1",start:"09:00",end:"09:45",subject:a[3],teacher:a[2],room:a[4]}));
 });
 return {version:2,classes:cls,timetable:tt,exams:[{id:"exam-one",name:"Monthly Assessment",term:"1",year:"2026-2027",status:"Upcoming"}],marks:[],school:{name:"NXT GEN ENGLISH SCHOOL",year:"2026-2027"}};
}
function teachers(){let m=new Map();samples.forEach(a=>m.set(a[0].toLowerCase(),{name:a[0],subject:a[1]}));const d=academic(),stored=read(K,{Teachers:[]});(d.classes||[]).forEach(x=>{if(x.teacher&&!m.has(x.teacher.toLowerCase()))m.set(x.teacher.toLowerCase(),{name:x.teacher,subject:"General"})});(d.timetable||[]).forEach(x=>{if(x.teacher&&!m.has(x.teacher.toLowerCase()))m.set(x.teacher.toLowerCase(),{name:x.teacher,subject:x.subject})});(stored.Teachers||[]).forEach(x=>{if(x.name){if(x.status==="Inactive")m.delete(x.name.toLowerCase());else m.set(x.name.toLowerCase(),{name:x.name,subject:x.detail||x.subject||"General"})}});return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name))}
function assignments(){let found=new Map(),d=academic();d.classes.forEach(c=>{if(String(c.teacher||'').toLowerCase()===teacherName.toLowerCase()&&c.status!=="Inactive")found.set(c.name+"|"+c.section,{grade:c.name,section:c.section,role:"Class teacher"})});d.timetable.forEach(t=>{if(String(t.teacher||'').toLowerCase()===teacherName.toLowerCase()){let key=t.grade+"|"+t.section;if(!found.has(key))found.set(key,{grade:t.grade,section:t.section,role:"Subject teacher"})}});return [...found.values()]}
function lessons(){return academic().timetable.filter(x=>String(x.teacher||'').toLowerCase()===teacherName.toLowerCase())}
function subs(){let items=new Set(lessons().map(x=>x.subject));const t=teachers().find(x=>x.name===teacherName);if(t&&t.subject!=="General")items.add(t.subject);return [...items].filter(Boolean)}
function sections(){let all=assignments(),a=all.find(x=>x.grade+"|"+x.section===chosen);if(a)return a;if(all.length){chosen=all[0].grade+"|"+all[0].section;return all[0]}return null}
function roster(c){if(!c)return [];return students().filter(s=>s.grade===c.grade&&s.section===c.section&&s.status!=="Inactive").sort((a,b)=>String(a.admissionNo).localeCompare(String(b.admissionNo)))}
function myStudents(){let allowed=new Set(assignments().map(a=>a.grade+"|"+a.section));return students().filter(s=>allowed.has(s.grade+"|"+s.section)&&s.status!=="Inactive")}
function sessions(){let a=read(T,[]);return Array.isArray(a)?a:[]}
function ownSessions(){return sessions().filter(x=>String(x.teacher||'').toLowerCase()===teacherName.toLowerCase())}
function option(v,label,selected){return '<option value="'+esc(v)+'" '+(v===selected?"selected":"")+'>'+esc(label)+'</option>'}
function empty(cols,label){return '<tr><td class="empty" colspan="'+cols+'">'+esc(label)+'</td></tr>'}
function stats(){return '<div class="kpis">'+[["Assigned sections",assignments().length],["My students",myStudents().length],["Weekly lessons",lessons().length],["Attendance sessions",ownSessions().length]].map(x=>'<div class="glass kpi"><small>'+x[0]+'</small><b>'+x[1]+'</b><em>Browser demo records</em></div>').join("")+'</div>'}
function overview(){return '<div class="glass welcome"><span class="eyebrow">NXT GEN TEACHER WORKSPACE</span><h2>Welcome, '+esc(teacherName)+' 👋</h2><p>Manage your teaching activities in one organized place.</p></div>'+stats()+'<section class="glass panel"><h2>Quick actions</h2><div class="actions">'+[["attendance","Take Attendance"],["students","My Students"],["timetable","My Timetable"],["marks","Enter Marks"],["records","My Records"]].map(x=>'<button class="action" data-go="'+x[0]+'">'+x[1]+' →</button>').join("")+'</div></section><section class="glass panel"><h2>My assigned classes</h2><div class="mini-list">'+(assignments().map(x=>'<div><b>'+esc(x.grade+" · "+x.section)+'</b><small>'+esc(x.role)+'</small></div>').join("")||'<p class="helper alert">No class assignments yet. Ask the demo administrator to assign a class or timetable period.</p>')+'</div></section>'}
function rosterPage(){let s=myStudents().filter(x=>!q||[x.name,x.admissionNo,x.grade,x.section].join(" ").toLowerCase().includes(q.toLowerCase()));return '<section class="glass panel"><h2>My Students</h2><p class="desc">Current students in sections assigned to this teacher.</p><div class="search-row"><input id="mySearch" type="search" value="'+esc(q)+'" placeholder="Search name, admission number, class"></div><div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Admission No.</th><th>Class</th><th>Parent</th></tr></thead><tbody>'+(s.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.admissionNo)+'</td><td>'+esc(x.grade+" / "+x.section)+'</td><td>'+esc(x.parent||"—")+'</td></tr>').join("")||empty(4,"No students in your assigned classes."))+'</tbody></table></div></section>'}
function timetablePage(){
 const all=lessons().slice().sort((a,b)=>["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(a.day)-["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(b.day)||String(a.start).localeCompare(String(b.start)));
 const filtered=all.filter(x=>!q||[x.day,x.grade,x.section,x.subject,x.teacher,x.room,x.start,x.end].join(" ").toLowerCase().includes(q.toLowerCase()));
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 const cards=days.map(day=>'<div class="tt-day"><h3>'+day+'</h3>'+(filtered.filter(t=>t.day===day).map(t=>'<article class="timetable-card"><b>'+esc(t.subject)+'</b><small>'+esc(t.grade)+' / '+esc(t.section)+'</small><small>Period '+esc(t.period)+' · '+esc(t.start)+' – '+esc(t.end)+'</small><span class="tt-chip">'+esc(t.room||"Room not set")+'</span><div class="tt-row-actions"><button type="button" data-tt-edit="'+esc(t.id)+'">Edit</button><button class="delete" type="button" data-tt-delete="'+esc(t.id)+'">Delete</button></div></article>').join("")||'<p class="tt-none">No scheduled lessons</p>')+'</div>').join("");
 return '<section class="glass panel"><div class="timetable-tools"><div><h2>Weekly timetable</h2><p class="desc">Your assigned weekly teaching periods, linked with the admin timetable.</p></div><div class="timetable-actions"><button type="button" id="newTimetable" class="primary">＋ Add period</button><button type="button" id="ttExport" class="btn secondary">↓ Export CSV</button><button type="button" id="ttPrint" class="btn secondary">Print timetable</button></div></div>'
  +'<div class="search-row"><input id="mySearch" type="search" value="'+esc(q)+'" placeholder="Search day, subject, room or class"></div><p class="tt-meta">'+filtered.length+' visible lessons · '+assignments().length+' assigned class sections · Edits save in this browser</p><div class="tt-grid">'+cards+'</div></section>'
  +'<section class="glass panel"><h2>Timetable list</h2><div class="table-wrap"><table class="data"><thead><tr><th>Day</th><th>Class</th><th>Period</th><th>Time</th><th>Subject</th><th>Room</th><th>Actions</th></tr></thead><tbody>'+(filtered.map(t=>'<tr><td>'+esc(t.day)+'</td><td>'+esc(t.grade)+' / '+esc(t.section)+'</td><td>'+esc(t.period)+'</td><td>'+esc(t.start)+' – '+esc(t.end)+'</td><td>'+esc(t.subject)+'</td><td>'+esc(t.room||"—")+'</td><td><div class="tt-row-actions"><button type="button" data-tt-edit="'+esc(t.id)+'">Edit</button><button type="button" class="delete" data-tt-delete="'+esc(t.id)+'">Delete</button></div></td></tr>').join("")||empty(7,"No timetable records found."))+'</tbody></table></div></section>';
}
function ttForm(existing){
 const d=academic(),assign=assignments();if(!assign.length){alert("Your teacher account must have an assigned class before adding periods. Assign it in the Admin portal → Classes.");return;}
 const item=existing||{};
 const set=assign.some(a=>a.grade===item.grade&&a.section===item.section)?item.grade+"|"+item.section:assign[0].grade+"|"+assign[0].section;
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 const subjects=Array.from(new Set([...subs(),"English","Mathematics","Science","Social Science","Marathi","Hindi","Computer","Physical Education","Art","General Knowledge"])).filter(Boolean);
 const chosenSub=item.subject||subjects[0]||"Mathematics";
 if(!subjects.includes(chosenSub))subjects.push(chosenSub);
 document.getElementById("ttDialog")?.remove();
 const dialog=document.createElement("div");dialog.id="ttDialog";dialog.className="tt-dialog-backdrop";
 dialog.innerHTML='<section class="tt-dialog" role="dialog" aria-modal="true" aria-labelledby="ttTitle"><div class="tt-dialog-head"><h2 id="ttTitle">'+(existing?"Edit teaching period":"Add a teaching period")+'</h2><button type="button" id="ttClose" aria-label="Close">✕</button></div><p class="desc">Your timetable is shared with the admin demo in this browser. School permission rules require a real backend.</p>'
 +'<form id="ttForm"><div class="form-grid"><label>Assigned class<select name="assignment" required>'+assign.map(a=>option(a.grade+"|"+a.section,a.grade+" · Division "+a.section,set)).join("")+'</select></label>'
 +'<label>Day<select name="day" required>'+days.map(x=>option(x,x,item.day||"Monday")).join("")+'</select></label>'
 +'<label>Period<select name="period" required>'+Array.from({length:9},(_,i)=>option(String(i+1),"Period "+(i+1),String(item.period||1))).join("")+'</select></label>'
 +'<label>Subject<select name="subject" required>'+subjects.map(x=>option(x,x,chosenSub)).join("")+'</select></label>'
 +'<label>Start time<input name="start" type="time" required value="'+esc(item.start||"09:00")+'"></label><label>End time<input name="end" type="time" required value="'+esc(item.end||"09:45")+'"></label>'
 +'<label class="wide">Room / location<input name="room" maxlength="50" placeholder="For example, Room 8A" value="'+esc(item.room||"")+'"></label></div>'
 +'<div class="save-row"><button class="btn secondary" type="button" id="ttCancel">Cancel</button><button class="primary" type="submit">Save timetable period</button></div></form></section>';
 document.body.append(dialog);
 const close=()=>dialog.remove();
 $("ttClose").onclick=close;$("ttCancel").onclick=close;
 dialog.onclick=e=>{if(e.target===dialog)close()};
 $("ttForm").onsubmit=e=>{
  e.preventDefault();const form=new FormData(e.currentTarget),pair=String(form.get("assignment")).split("|");
  const grade=pair[0],section=pair[1],day=String(form.get("day")),period=String(form.get("period")),start=String(form.get("start")),end=String(form.get("end")),sub=String(form.get("subject")),room=String(form.get("room")||"").trim();
  if(!assignments().some(a=>a.grade===grade&&a.section===section)){alert("The class is not assigned to your teacher record.");return;}
  if(!d.classes.some(x=>x.name===grade&&x.section===section&&x.status!=="Inactive")){alert("This class or division is not active.");return;}
  if(!start||!end||start>=end){alert("End time must be later than the start time.");return;}
  const clash=d.timetable.some(x=>x.id!==item.id&&x.day===day&&x.grade===grade&&x.section===section&&start<x.end&&x.start<end);
  if(clash){alert("This class already has a timetable period during that time.");return;}
  const teacherClash=d.timetable.some(x=>x.id!==item.id&&x.teacher===teacherName&&x.day===day&&start<x.end&&x.start<end);
  if(teacherClash){alert("You already teach another class during this time.");return;}
  const roomClash=room&&d.timetable.some(x=>x.id!==item.id&&x.day===day&&x.room&&x.room.trim().toLowerCase()===room.toLowerCase()&&start<x.end&&x.start<end);
  if(roomClash){alert("This room is scheduled for another class at that time.");return;}
  const next={id:item.id||"teacher-period-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),grade,section,day,period,start,end,subject:sub,room,teacher:teacherName};
  const ix=d.timetable.findIndex(t=>t.id===next.id);
  if(ix<0)d.timetable.push(next);else d.timetable[ix]=next;
  if(!save(A,d))return;
  close();q="";render();
 };
}
function bindTimetable(){
 $("newTimetable").onclick=()=>ttForm();
 $("ttExport").onclick=()=>exportRows("teacher_timetable",["Day","Class","Section","Period","Start","End","Subject","Room"],lessons().map(x=>[x.day,x.grade,x.section,x.period,x.start,x.end,x.subject,x.room||""]));
 $("ttPrint").onclick=()=>printReport("My weekly timetable",["Day","Class","Section","Period","Time","Subject","Room"],lessons().slice().sort((a,b)=>String(a.day).localeCompare(String(b.day))).map(x=>[x.day,x.grade,x.section,x.period,x.start+" – "+x.end,x.subject,x.room||"—"]));
 document.querySelectorAll("[data-tt-edit]").forEach(b=>b.onclick=()=>{let item=academic().timetable.find(x=>String(x.id)===String(b.dataset.ttEdit)&&x.teacher===teacherName);if(item)ttForm(item)});
 document.querySelectorAll("[data-tt-delete]").forEach(b=>b.onclick=()=>{const d=academic(),i=d.timetable.findIndex(x=>String(x.id)===String(b.dataset.ttDelete)&&x.teacher===teacherName);if(i<0)return;if(!confirm("Delete this teaching period from the shared demo timetable?"))return;d.timetable.splice(i,1);if(save(A,d))render();});
}
function exportRows(name,head,rows){
 const csv=[head,...rows].map(row=>row.map(v=>{let x=String(v??"");if(/^[=+\-@\t\r]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';}).join(",")).join("\r\n");
 const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="NXTGEN_"+name+"_"+localDay()+".csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function printReport(title,head,rows){
 if(!rows.length){alert("No records to print.");return;}
 const w=window.open("","_blank","width=1024,height=750");if(!w){alert("Allow popups to print.");return;}
 const html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{size:A4 landscape;margin:12mm}body{font:13px Arial,sans-serif;color:#1f334b;padding:22px}h1{font-size:21px;margin:0 0 5px}p{font-size:11px;color:#64748b}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{padding:10px;text-align:left;border:1px solid #dce4ef;font-size:11px}th{background:#f1f5f8}button{margin:12px 0;padding:10px}@media print{button{display:none}}</style></head><body><h1>NXT GEN ENGLISH SCHOOL</h1><p>'+esc(title)+' · '+esc(teacherName)+' · Academic demo · '+esc(localDay())+'</p><table><thead><tr>'+head.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join("")+'</tr>').join("")+'</tbody></table><p>DEMO ONLY · Browser-stored sample school records, not an official document.</p><button onclick="window.print()">Print / Save PDF</button></body></html>';
 w.document.write(html);w.document.close();
}
function attendancePage(){
 const assigned=sections();
 if(!assigned)return '<section class="glass panel"><h2>Take Attendance</h2><p class="helper alert">No sections are assigned to this teacher. Open the Admin demo → Classes & Sections and assign a class teacher, or add an assigned timetable period.</p></section>';
 const list=roster(assigned),filtered=list.filter(s=>!q||[s.name,s.admissionNo].join(" ").toLowerCase().includes(q.toLowerCase()));
 const present=list.filter(s=>marksMap[s.id]==="P").length,absent=list.filter(s=>marksMap[s.id]==="A").length,unmarked=list.length-present-absent;
 const completion=list.length?Math.round(100*(present+absent)/list.length):0;
 const selectedSubject=subject||subs()[0]||"";
 const existing=sessions().find(r=>r.date===when&&r.grade===assigned.grade&&r.section===assigned.section&&r.subject===selectedSubject&&r.lecture==="Period "+period);
 return '<section class="glass panel"><div class="section-head"><div><h2>Take Attendance</h2><p>Class attendance · P = Present, A = Absent · All students must be marked.</p></div><span class="att-session-pill">'+esc(when)+'</span></div>'
 +'<div class="filter-row"><label>Class & section<select id="attClass">'+assignments().map(x=>option(x.grade+"|"+x.section,x.grade+" · "+x.section,chosen)).join("")+'</select></label><label>Attendance date<input id="attDate" type="date" max="'+localDay()+'" value="'+esc(when)+'"></label><label>Period<select id="attPeriod">'+Array.from({length:8},(_,i)=>option(String(i+1),"Period "+(i+1),period)).join("")+'</select></label><label>Subject<select id="attSubject">'+subs().map(x=>option(x,x,selectedSubject)).join("")+'</select></label></div>'
 +(existing?'<p class="helper alert">A session already exists for this class, date, subject and period. To avoid duplicates, choose a different session or review the saved record.</p>':'')
 +'<div class="att-toolbar"><div class="roster-summary"><span>Total '+list.length+'</span><span>Present '+present+'</span><span>Absent '+absent+'</span><span>Remaining '+unmarked+'</span></div><small>'+completion+'% marked</small></div>'
 +'<div class="att-progress" role="progressbar" aria-valuenow="'+completion+'" aria-valuemin="0" aria-valuemax="100" aria-label="Attendance marking progress"><span style="width:'+completion+'%"></span></div>'
 +'<div class="search-row"><input id="mySearch" type="search" value="'+esc(q)+'" placeholder="Search student or admission number"></div>'
 +'<div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Admission</th><th>Attendance</th></tr></thead><tbody>'+(filtered.map(s=>'<tr><td><b>'+esc(s.name)+'</b></td><td>'+esc(s.admissionNo)+'</td><td><div class="row-buttons"><button type="button" aria-pressed="'+(marksMap[s.id]==="P")+'" class="mark-button '+(marksMap[s.id]==="P"?"selected-present":"")+'" data-mark="'+esc(s.id)+'" data-status="P">✓ Present</button><button type="button" aria-pressed="'+(marksMap[s.id]==="A")+'" class="mark-button '+(marksMap[s.id]==="A"?"selected-absent":"")+'" data-mark="'+esc(s.id)+'" data-status="A">✕ Absent</button></div></td></tr>').join("")||empty(3,"No matching students"))+'</tbody></table></div>'
 +'<div class="actions"><button type="button" class="action" id="attAll">✓ Mark all present</button><button type="button" class="action" id="attClear">Clear all marks</button><button type="button" class="action" id="attViewRecords">View saved sessions</button></div>'
 +'<div class="save-row"><button class="primary" type="button" id="attSave" '+(!list.length||!!existing?"disabled":"")+'>Save '+present+' present / '+absent+' absent →</button></div>'
 +'<p class="desc">The attendance register is shared only with this device’s Admin demo. It does not send data to a school database or verify a class photo.</p></section>';
}
function marksPage(){let d=academic(),allowed=myStudents(),subjects=subs();let displayed=d.marks.filter(m=>allowed.some(s=>s.id===m.studentId));return '<section class="glass panel"><h2>Enter Marks</h2><p class="desc">Marks must belong to students in your assigned sections and subjects linked to your teacher record.</p><form id="marksForm" class="form-grid"><label>Student<select name="studentId" required>'+allowed.map(s=>option(s.id,s.name+" · "+s.admissionNo,allowed[0]?.id)).join("")+'</select></label><label>Exam<select name="examId" required>'+d.exams.map(e=>option(e.id,e.name+" · "+e.year,d.exams[0]?.id)).join("")+'</select></label><label>Subject<select name="subject" required>'+subjects.map(x=>option(x,x,subjects[0])).join("")+'</select></label><label>Maximum marks<input name="max" type="number" min="1" max="1000" step="0.5" value="100" required></label><label>Marks obtained<input name="score" type="number" min="0" max="1000" step="0.5" required></label><div class="save-row"><button class="primary" '+(!allowed.length||!subjects.length||!d.exams.length?"disabled":"")+'>Save marks →</button></div></form></section><section class="glass panel"><h2>Marks Register</h2><div class="table-wrap"><table class="data"><thead><tr><th>Student</th><th>Exam</th><th>Subject</th><th>Marks</th></tr></thead><tbody>'+(displayed.map(m=>'<tr><td>'+esc(allowed.find(s=>s.id===m.studentId)?.name||"—")+'</td><td>'+esc(d.exams.find(e=>e.id===m.examId)?.name||"—")+'</td><td>'+esc(m.subject)+'</td><td>'+esc(m.score+" / "+m.max)+'</td></tr>').join("")||empty(4,"No marks entered for assigned classes."))+'</tbody></table></div></section>'}
function recordsPage(){
 const records=ownSessions().filter(r=>!q||[r.date,r.grade,r.section,r.subject,r.lecture].join(" ").toLowerCase().includes(q.toLowerCase()));
 const rows=records.map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.grade+" / "+r.section)+'</td><td>'+esc(r.subject)+'</td><td>'+esc(r.lecture)+'</td><td>'+esc(r.present+" / "+r.total)+'</td><td>'+Math.round((r.total?Number(r.present)/Number(r.total):0)*100)+'%</td><td><button class="action" type="button" data-rec-print="'+esc(r.id)+'">Print</button></td></tr>').join("");
 return '<section class="glass panel"><div class="section-head"><div><h2>My attendance records</h2><p>Filter, print or export your previously saved sessions.</p></div><div class="timetable-actions"><button id="recExport" class="btn secondary" type="button">↓ CSV</button><button id="recPrintAll" class="btn secondary" type="button">Print report</button></div></div><div class="search-row"><input id="mySearch" type="search" value="'+esc(q)+'" placeholder="Search date, class, section or subject"></div><div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Class</th><th>Subject</th><th>Period</th><th>Present / Total</th><th>Percentage</th><th>Print</th></tr></thead><tbody>'+(rows||empty(7,"No matching attendance sessions."))+'</tbody></table></div></section>';
}
function recordRows(rows){return rows.map(r=>[r.date,r.grade,r.section,r.subject,r.lecture,r.total,r.present,r.absent,Math.round((r.total?Number(r.present)/Number(r.total):0)*100)+"%"])}
function bindRecords(){
 const filtered=()=>ownSessions().filter(r=>!q||[r.date,r.grade,r.section,r.subject,r.lecture].join(" ").toLowerCase().includes(q.toLowerCase()));
 const h=["Date","Class","Section","Subject","Period","Total","Present","Absent","Attendance"];
 $("recExport").onclick=()=>exportRows("teacher_attendance",h,recordRows(filtered()));
 $("recPrintAll").onclick=()=>printReport("Attendance history",h,recordRows(filtered()));
 document.querySelectorAll("[data-rec-print]").forEach(b=>b.onclick=()=>{const r=ownSessions().find(x=>String(x.id)===String(b.dataset.recPrint));if(!r)return;const head=["Admission number","Student","Status"],rows=(r.students||[]).map(s=>[s.admissionNo,s.name,s.status==="P"?"Present":"Absent"]);printReport("Attendance · "+r.date+" · "+r.grade+" / "+r.section+" · "+r.subject,head,rows)});
}
const titles={overview:"Teacher Overview",attendance:"Take Attendance",students:"My Students",timetable:"My Timetable",marks:"Enter Marks",records:"My Records"};
function render(){if(!teacherName)return;let current=teachers().some(t=>t.name===teacherName);if(!current){logout();return;}$("pageTitle").textContent=titles[tab];$("breadcrumb").textContent=titles[tab];$("teacherInitials").textContent=teacherName.split(" ").slice(-2).map(x=>x[0]).join("").toUpperCase();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));$("teacherContent").innerHTML=({overview,attendance:attendancePage,students:rosterPage,timetable:timetablePage,marks:marksPage,records:recordsPage})[tab]();document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));const search=$("mySearch");if(search)search.oninput=()=>{q=search.value;let pos=search.selectionStart;render();let next=$("mySearch");if(next){next.focus();next.setSelectionRange(pos,pos)}};if(tab==="attendance")bindAttendance();if(tab==="marks")bindMarks();if(tab==="timetable")bindTimetable();if(tab==="records")bindRecords()}
function go(p){if(!titles[p])return;tab=p;q="";if(tab==="attendance"){marksMap={};subject=subs()[0]||"";}render();window.scrollTo({top:0,behavior:"auto"})}
function bindAttendance(){let c=$("attClass");if(c)c.onchange=()=>{chosen=c.value;marksMap={};q="";render()};let date=$("attDate");if(date)date.onchange=()=>{when=date.value;marksMap={};render()};let per=$("attPeriod");if(per)per.onchange=()=>{period=per.value;marksMap={};render()};let sb=$("attSubject");if(sb)sb.onchange=()=>{subject=sb.value;marksMap={};render()};const view=$("attViewRecords");if(view)view.onclick=()=>go("records");document.querySelectorAll("[data-mark]").forEach(b=>b.onclick=()=>{marksMap[b.dataset.mark]=b.dataset.status;render()});$("attAll").onclick=()=>{roster(sections()).forEach(s=>marksMap[s.id]="P");render()};$("attClear").onclick=()=>{marksMap={};render()};$("attSave").onclick=()=>{const c=sections(),list=roster(c),sub=subject||subs()[0];if(!c||!assignments().some(x=>x.grade===c.grade&&x.section===c.section)){alert("Choose an assigned class.");return;}if(!/^\d{4}-\d{2}-\d{2}$/.test(when)||when>localDay()){alert("Choose a valid date, not in the future.");return;}if(!subs().includes(sub)){alert("Choose an assigned subject.");return;}if(!list.length||list.some(s=>!["P","A"].includes(marksMap[s.id]))){alert("Mark all students before saving.");return;}let all=sessions();if(all.some(r=>r.date===when&&r.grade===c.grade&&r.section===c.section&&r.subject===sub&&r.lecture==="Period "+period)){alert("This session is already recorded.");return;}let p=list.filter(s=>marksMap[s.id]==="P").length;all.unshift({id:"tatt-"+Date.now(),date:when,teacher:teacherName,grade:c.grade,section:c.section,division:c.section,subject:sub,lecture:"Period "+period,total:list.length,present:p,absent:list.length-p,students:list.map(s=>({id:s.id,name:s.name,admissionNo:s.admissionNo,status:marksMap[s.id]})),photoName:"Teacher demo",photoData:"",savedAt:new Date().toISOString()});if(save(T,all.slice(0,80))){marksMap={};alert("Attendance saved in this browser demo.");go("records")}}}
function bindMarks(){const form=$("marksForm");form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form),sid=String(fd.get("studentId")),eid=String(fd.get("examId")),sub=String(fd.get("subject")),max=Number(fd.get("max")),score=Number(fd.get("score"));let d=academic();if(!myStudents().some(s=>String(s.id)===sid)||!d.exams.some(x=>String(x.id)===eid)||!subs().includes(sub)){alert("Student, exam or subject is not assigned to this teacher.");return;}if(!Number.isFinite(score)||!Number.isFinite(max)||max<1||max>1000||score<0||score>max){alert("Invalid marks. Enter a score between zero and maximum marks.");return;}let old=d.marks.find(m=>String(m.studentId)===sid&&String(m.examId)===eid&&m.subject===sub);if(old){if(!confirm("Update the existing marks entry?"))return;old.score=score;old.max=max;}else d.marks.push({id:"teacher-mark-"+Date.now(),studentId:sid,examId:eid,subject:sub,max,score});if(save(A,d)){alert("Marks saved in this browser demo.");render()}}}
function logout(){sessionStorage.removeItem("nxt_teacher_demo");teacherName="";$("teacherApp").hidden=true;$("loginScreen").hidden=false;$("teacherCode").value="";}
function init(){$("teacherSelect").innerHTML='<option value="">Select teacher account</option>'+teachers().map(x=>option(x.name,x.name+" · "+x.subject,"")).join("");$("teacherLoginForm").onsubmit=e=>{e.preventDefault();let name=$("teacherSelect").value,code=$("teacherCode").value;if(!teachers().some(t=>t.name===name)||code!=="TEACHER2026"){$("loginError").textContent="Select a teacher and enter the public demo code TEACHER2026.";$("loginError").hidden=false;return;}$("loginError").hidden=true;teacherName=name;sessionStorage.setItem("nxt_teacher_demo",name);$("loginScreen").hidden=true;$("teacherApp").hidden=false;go("overview")};$("showCode").onclick=()=>{let e=$("teacherCode");e.type=e.type==="password"?"text":"password";$("showCode").textContent=e.type==="password"?"Show":"Hide"};document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>go(b.dataset.tab));$("logoutSide").onclick=logout;$("logoutTop").onclick=logout;let remembered=sessionStorage.getItem("nxt_teacher_demo");if(remembered&&teachers().some(t=>t.name===remembered)){teacherName=remembered;$("loginScreen").hidden=true;$("teacherApp").hidden=false;go("overview")}}
document.addEventListener("DOMContentLoaded",init);
})();
