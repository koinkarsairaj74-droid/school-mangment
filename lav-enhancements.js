/* LAV SMS academic & administration demo modules.
   Inspired by the user-supplied Laravel 8 LAV SMS project (MIT).
   Browser-only demonstration. No authentication or shared database. */
(function(){
"use strict";
var KEY="lavsms-academic-suite-v2";
var schoolData=null;
var DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var SUBJECTS=["English","Mathematics","Science","Social Science","Marathi","Hindi","Computer","General Knowledge","Physical Education","Art"];
function text(x){return escapeHtml(x==null?"":String(x));}
function uid(tag){return tag+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
function value(id){var e=document.getElementById(id);return e?e.value.trim():"";}
function norm(x){return String(x||"").trim().toLowerCase();}
function money(x){return Number(x||0).toLocaleString("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});}
function dateToday(){return new Date().toLocaleDateString("en-CA");}
function load(){
 if(schoolData)return schoolData;
 var defaults={version:2,school:{name:"NXT GEN ENGLISH SCHOOL",address:"Dream City Nagar, Appawadi, Pune, Maharashtra",year:"2026-2027",phone:"",email:"",principal:"Principal",receiptPrefix:"LAV"},classes:[],timetable:[],exams:[{id:"exam-one",name:"Monthly Assessment",term:"1",year:"2026-2027",status:"Upcoming"}],marks:[]};
 var names=["Nursery","Junior KG","Senior KG"];for(var i=1;i<=10;i++)names.push("Class "+i);
 names.forEach(function(n){var sections=n==="Class 8"?["A","B","C","D"]:["A"];sections.forEach(function(sec){defaults.classes.push({id:uid("cls"),name:n,section:sec,teacher:n==="Class 8"?(sec==="A"?"Mrs. Meera Kulkarni":"Mr. Rahul Deshmukh"):"",room:"",status:"Active"});});});
 ["Monday","Tuesday","Wednesday","Thursday","Friday"].forEach(function(day,i){
  defaults.timetable.push({id:uid("tt"),grade:"Class 8",section:"A",day:day,period:"1",start:"09:00",end:"09:45",subject:SUBJECTS[(i+1)%SUBJECTS.length],teacher:"Mrs. Meera Kulkarni",room:"101"});
 });
 try{var prev=localStorage.getItem(KEY);if(prev){var parsed=JSON.parse(prev);if(parsed&&parsed.version===2&&Array.isArray(parsed.classes)&&Array.isArray(parsed.timetable)&&Array.isArray(parsed.exams)&&Array.isArray(parsed.marks)){schoolData=parsed;schoolData.school=Object.assign(defaults.school,parsed.school||{});return schoolData;}}}catch(e){console.warn("LAV school demo data could not be loaded",e);}
 schoolData=defaults;return schoolData;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(load()));return true;}catch(e){alert("This browser could not save demo data. Check browser storage.");return false;}}
function locate(kind){if(kind==="Teachers")return records.Teachers;if(kind==="Parents")return records.Parents;return load()[kind];}
function assure(kind){if(kind==="Teachers"){records.Teachers=records.Teachers||[];records.Teachers.forEach(function(x){if(!x.id)x.id=uid("teacher");});}
 if(kind==="Parents"){records.Parents=records.Parents||[];records.Parents.forEach(function(x){if(!x.id)x.id=uid("parent");});}
 return locate(kind);}
function persist(kind){if(kind==="Teachers"||kind==="Parents")return saveRecords();return save();}
function header(title,desc,actions){return '<section class="glass lav-intro"><div><span class="lav-eyebrow">NXT GEN · ACADEMIC MANAGEMENT</span><h2>'+text(title)+'</h2><p>'+text(desc)+'</p></div><div class="lav-actions">'+(actions||"")+'</div></section>';}
function button(kind,label,icon){return '<button class="btn" type="button" data-lav-action="add" data-lav-kind="'+kind+'">'+(icon||"＋")+' '+text(label)+'</button>';}
function noRows(cols,label){return '<tr><td colspan="'+cols+'" class="empty">'+text(label||"No records to show. Add your first record.")+'</td></tr>';}
function table(head,rows){return '<section class="glass panel lav-panel"><div class="tablewrap"><table class="data lav-table"><thead><tr>'+head.map(function(x){return "<th>"+text(x)+"</th>";}).join("")+'</tr></thead><tbody>'+rows+'</tbody></table></div></section>';}
function actions(kind,id){return '<div class="lav-row-actions"><button type="button" data-lav-action="edit" data-lav-kind="'+kind+'" data-lav-id="'+text(id)+'">Edit</button><button type="button" class="lav-danger" data-lav-action="delete" data-lav-kind="'+kind+'" data-lav-id="'+text(id)+'">Delete</button></div>';}
function filter(items,keys){var q=norm(document.getElementById("search")?document.getElementById("search").value:"");if(!q)return items;return items.filter(function(x){return keys.map(function(k){return String(x[k]||"");}).join(" ").toLowerCase().includes(q);});}
function schoolStats(){
 var total=records.Students.length;
 var att=loadAttendanceSessions();
 var fees=loadFeeReceipts();
 var amount=fees.reduce(function(v,x){return v+Number(x.amountPaid||0);},0);
 return {students:total,teachers:records.Teachers.length,classes:load().classes.length,attendance:att.length,fees:fees.length,received:amount,exams:load().exams.length};
}
function overview(){
 var s=schoolStats(),d=load(),today=dateToday();
 var receipts=loadFeeReceipts().slice(0,4);
 var latest=receipts.map(function(x){return '<div class="lav-feed"><span>₹</span><div><b>'+text(x.studentName||"Demo student")+'</b><small>'+text(x.receiptNo||"Receipt")+' · '+text(x.paymentDate||"")+'</small></div><strong>'+money(x.amountPaid)+'</strong></div>';}).join("");
 return '<section class="glass lav-hero"><span class="lav-eyebrow">LAV SMS · 2026–27 · INTERACTIVE DEMONSTRATION</span><h2>'+text(d.school.name)+'</h2><p>'+text(d.school.address)+'</p><div class="lav-hero-buttons"><button class="btn" data-page="Students">＋ Student admission</button><button class="btn secondary" data-page="Fees">Create fee receipt</button><button class="btn secondary" data-page="Exams & Marks">Exams & marks</button></div></section>'
 +'<div class="lav-kpis">'+[["Students",s.students,"♙"],["Teaching staff",s.teachers,"♧"],["Class sections",s.classes,"▤"],["Receipts saved",s.fees,"₹"]].map(function(x){return '<section class="glass lav-kpi"><span>'+x[2]+'</span><small>'+x[0]+'</small><b>'+x[1]+'</b></section>';}).join("")+'</div>'
 +'<div class="lav-dual"><section class="glass panel"><div class="lav-title-row"><h3>Academic management</h3><small>Based on LAV SMS structure</small></div><div class="lav-shortcuts">'+[["Classes","Class & sections","▤"],["Timetable","Weekly timetable","◷"],["Exams & Marks","Exam records","✎"],["Attendance","Record attendance","✓"],["Parents","Parent directory","♙"],["Reports","Export & summaries","▥"]].map(function(x){return '<button type="button" class="lav-shortcut" data-page="'+x[0]+'"><span>'+x[2]+'</span><div><b>'+x[1]+'</b><small>Open '+x[0]+'</small></div><em>→</em></button>';}).join("")+'</div></section>'
 +'<section class="glass panel"><div class="lav-title-row"><h3>Recent fee receipts</h3><small>'+money(s.received)+' received (demo)</small></div>'+(latest||'<p class="lav-muted">No fee receipts saved yet. Use the Fees module to create one.</p>')+'<div class="lav-mini-kpis"><span>Attendance sessions <b>'+s.attendance+'</b></span><span>Exam types <b>'+s.exams+'</b></span></div><p class="lav-disclaimer">Demo data stays in this browser. This is not a secure live school database.</p></section></div>';
}
function teachers(){
 var all=assure("Teachers");var arr=filter(all,["name","detail","phone","email","status"]);
 var rows=arr.map(function(t){return '<tr><td><b>'+text(t.name)+'</b><small class="lav-sub">'+text(t.email||"")+'</small></td><td>'+text(t.detail||t.subject||"—")+'</td><td>'+text(t.phone||"—")+'</td><td><span class="badge">'+text(t.status||"Active")+'</span></td><td>'+actions("Teachers",t.id)+'</td></tr>';}).join("");
 return header("Teaching staff","Manage teacher records, subjects and contact details.",button("Teachers","Add teacher"))+table(["Teacher","Subject","Contact","Status","Actions"],rows||noRows(5));
}
function classes(){
 var arr=filter(load().classes,["name","section","teacher","room","status"]);
 var rows=arr.map(function(c){var count=records.Students.filter(function(s){return s.grade===c.name&&s.section===c.section;}).length;
  return '<tr><td><b>'+text(c.name)+'</b></td><td><span class="lav-section">'+text(c.section)+'</span></td><td>'+text(c.teacher||"Not assigned")+'</td><td>'+count+' students</td><td>'+text(c.room||"—")+'</td><td>'+actions("classes",c.id)+'</td></tr>';}).join("");
 return header("Classes & sections","Class-based student structure and section teachers, inspired by LAV SMS.",button("classes","Add class / section"))+table(["Class","Division","Class teacher","Students","Room","Actions"],rows||noRows(6));
}
function timetable(){
 var arr=filter(load().timetable,["grade","section","day","period","start","end","subject","teacher","room"]);
 arr.sort(function(a,b){return DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||String(a.start).localeCompare(String(b.start));});
 var rows=arr.map(function(c){return '<tr><td><b>'+text(c.day)+'</b></td><td>'+text(c.grade)+' · '+text(c.section)+'</td><td>'+text(c.period)+'</td><td><b>'+text(c.start)+' – '+text(c.end)+'</b></td><td>'+text(c.subject)+'</td><td>'+text(c.teacher||"—")+'</td><td>'+actions("timetable",c.id)+'</td></tr>';}).join("");
 return header("Weekly timetable","Manage class periods, subjects, timings and assigned teachers.",button("timetable","Add period")+'<button class="btn secondary" data-lav-action="csv" data-lav-kind="timetable">↓ Export CSV</button>')
 +'<div class="lav-kpis lav-compact">'+[["Scheduled periods",load().timetable.length],["Teaching days",new Set(load().timetable.map(function(t){return t.day;})).size],["Subjects",new Set(load().timetable.map(function(t){return t.subject;})).size]].map(function(x){return '<section class="glass lav-kpi"><small>'+x[0]+'</small><b>'+x[1]+'</b></section>';}).join("")+'</div>'
 +table(["Day","Class","Period","Time","Subject","Teacher","Actions"],rows||noRows(7));
}
function gradeFor(mark,max){if(!max)return "—";var p=(Number(mark)/Number(max))*100;return p>=75?"A+":p>=60?"A":p>=45?"B":p>=35?"C":"F";}
function exams(){
 var d=load();var rows=filter(d.exams,["name","term","year","status"]).map(function(x){
  return '<tr><td><b>'+text(x.name)+'</b></td><td>Term '+text(x.term)+'</td><td>'+text(x.year)+'</td><td>'+d.marks.filter(function(m){return m.examId===x.id;}).length+' marks</td><td><span class="badge">'+text(x.status)+'</span></td><td>'+actions("exams",x.id)+'</td></tr>';}).join("");
 var q=norm(document.getElementById("search")?document.getElementById("search").value:"");
 var marks=d.marks.filter(function(m){var st=records.Students.find(function(x){return x.id===m.studentId;});var ex=d.exams.find(function(x){return x.id===m.examId;});return !q||[st&&st.name,ex&&ex.name,m.subject,m.score].join(" ").toLowerCase().includes(q);});
 var markRows=marks.slice().reverse().map(function(m){var st=records.Students.find(function(x){return x.id===m.studentId;});var ex=d.exams.find(function(x){return x.id===m.examId;});
  return '<tr><td><b>'+text(st&&st.name||"Student removed")+'</b><small class="lav-sub">'+text(st&&st.admissionNo||"")+'</small></td><td>'+text(ex&&ex.name||"Exam removed")+'</td><td>'+text(m.subject)+'</td><td><b>'+text(m.score)+' / '+text(m.max)+'</b></td><td><span class="lav-grade">'+gradeFor(m.score,m.max)+'</span></td><td>'+actions("marks",m.id)+'</td></tr>';}).join("");
 return header("Exams & marks","Create assessments, enter student marks and print individual mark sheets.",button("exams","Create exam")+' '+button("marks","Enter marks"))
  +'<div class="lav-title-row"><h3>Exam schedule</h3><small>'+d.exams.length+' assessments</small></div>'+table(["Exam","Term","Session","Marks entries","Status","Actions"],rows||noRows(6,"No exams configured. Create an exam first."))
  +'<div class="lav-title-row"><h3>Student mark register</h3><small>Grade scale: A+ 75% · A 60% · B 45% · C 35%</small></div>'+table(["Student","Exam","Subject","Marks","Grade","Actions"],markRows||noRows(6,"No marks entered yet."))
  +'<section class="glass panel lav-print-bar"><b>Print individual marksheet</b><select id="lavMarkExam" aria-label="Choose exam for the marksheet"><option value="">All recorded exams</option>'+d.exams.map(function(x){return '<option value="'+text(x.id)+'">'+text(x.name)+' · '+text(x.year)+'</option>';}).join("")+'</select><select id="lavMarkStudent" aria-label="Student to print">'+records.Students.map(function(x){return '<option value="'+text(x.id)+'">'+text(x.name)+' · '+text(x.admissionNo)+'</option>';}).join("")+'</select><button class="btn secondary" data-lav-action="print-marks">Print marksheet</button></section>';
}
function parents(){
 var all=assure("Parents");
 var arr=filter(all,["name","detail","phone","email","status"]);
 var q=norm(document.getElementById("search")?.value);if(q)arr=all.filter(function(p){return [p.name,p.detail,p.phone,p.email,p.status].concat(records.Students.filter(function(s){return norm(s.parent)===norm(p.name);}).map(function(s){return s.name+" "+s.admissionNo+" "+s.grade;})).join(" ").toLowerCase().includes(q);});
 var rows=arr.map(function(p){
  var children=records.Students.filter(function(s){return norm(s.parent)===norm(p.name);}).slice(0,5);
  return '<tr><td><b>'+text(p.name)+'</b></td><td>'+text(p.phone||"—")+'<small class="lav-sub">'+text(p.email||"")+'</small></td><td>'+text(children.map(function(c){return c.name+" ("+c.grade+")";}).join(", ")||p.detail||"No linked student")+'</td><td><span class="badge">'+text(p.status||"Active")+'</span></td><td>'+actions("Parents",p.id)+'</td></tr>';}).join("");
 return header("Parents & guardians","Parent contact directory. Children match a student's recorded parent name.",button("Parents","Add parent"))+table(["Guardian","Contact","Linked students","Status","Actions"],rows||noRows(5));
}
function miniStat(title,val,note){return '<div class="glass lav-kpi"><small>'+text(title)+'</small><b>'+text(val)+'</b><em>'+text(note)+'</em></div>';}
function reports(){
 var st=schoolStats(),attendance=loadAttendanceSessions();
 var present=attendance.reduce(function(a,v){return a+Number(v.present||0);},0),total=attendance.reduce(function(a,v){return a+Number(v.total||0);},0),rate=total?Math.round(present/total*100):0;
 var stats='<div class="lav-kpis">'+miniStat("Students",st.students,"Total demo register")+miniStat("Attendance",rate+"%","Across "+st.attendance+" sessions")+miniStat("Fee collection",money(st.received),st.fees+" receipts")+miniStat("Entered marks",load().marks.length,"Assessment records")+'</div>';
 var recent=attendance.slice(0,6).map(function(s){return '<tr><td>'+text(s.date||"—")+'</td><td>'+text(s.grade||"—")+' · '+text(s.section||s.division||"A")+'</td><td>'+text(s.subject||"—")+'</td><td>'+Number(s.present||0)+' / '+Number(s.total||0)+'</td></tr>';}).join("");
 var datasets=[["Students","students"],["Teachers","teachers"],["Classes","classes"],["Parents","parents"],["Timetable","timetable"],["Exams","exams"],["Marks","marks"],["Attendance","attendance"],["Fee receipts","receipts"]];
 return header("School reports","Track demo activity, export registers and create a browser backup.",'<button class="btn" data-lav-action="backup">↓ Backup all demo data</button>')+stats
  +'<section class="glass panel"><div class="lav-title-row"><h3>Download CSV registers</h3><small>For spreadsheet review</small></div><div class="lav-export-grid">'+datasets.map(function(x){return '<button class="lav-export" data-lav-action="csv" data-lav-kind="'+x[1]+'"><span>▥</span><b>'+x[0]+'</b><small>Export .csv ↓</small></button>';}).join("")+'</div></section>'
  +'<div class="lav-title-row"><h3>Recent attendance sessions</h3><small>Saved in this browser</small></div>'+table(["Date","Class","Subject","Present / Total"],recent||noRows(4,"No attendance records yet."))
  +'<section class="glass panel lav-import"><div><h3>Restore a demo backup</h3><p>Only import your own LAV SMS demo JSON. This replaces records stored in this browser.</p></div><label class="btn secondary">Choose backup JSON<input type="file" accept=".json,application/json" id="lavRestoreInput" hidden></label></section>';
}
function field(name,label,type,val,required,opts){
 var attr=' id="lav-field-'+name+'" name="'+name+'" '+(required?'required ':'');
 var inner='';
 if(type==="select"){inner='<select'+attr+'>'+opts.map(function(x){var v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return '<option value="'+text(v)+'" '+(String(v)===String(val)?"selected":"")+'>'+text(l)+'</option>';}).join("")+'</select>';}
 else {inner='<input'+attr+' type="'+type+'" value="'+text(val??"")+'" '+(type==="number"?'min="0" step="0.01" ':'')+'autocomplete="off">';}
 return '<label class="lav-field"><span>'+text(label)+'</span>'+inner+'</label>';
}
function optionsClasses(){var keys=new Set(load().classes.map(function(x){return x.name;}));records.Students.forEach(function(x){keys.add(x.grade);});return Array.from(keys).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});}
function teacherNames(){return Array.from(new Set([""].concat(records.Teachers.map(function(x){return x.name;}))));}
function editForm(kind,item){
 var x=item||{},f='',classOpts=optionsClasses(),teacherOpts=teacherNames();
 if(kind==="Teachers"){f+=field("name","Teacher name","text",x.name,true)+field("detail","Subject / specialization","text",x.detail||x.subject,true)+field("phone","Phone (optional)","tel",x.phone)+field("email","Email (optional)","email",x.email)+field("status","Status","select",x.status||"Active",true,["Active","On leave","Inactive"]);}
 if(kind==="Parents"){f+=field("name","Parent / guardian name","text",x.name,true)+field("phone","Mobile number","tel",x.phone)+field("email","Email (optional)","email",x.email)+field("detail","Notes (optional)","text",x.detail)+field("status","Status","select",x.status||"Active",true,["Active","Inactive"]);}
 if(kind==="classes"){f+=field("name","Class name","select",x.name||"Class 8",true,classOpts)+field("section","Division / section","select",x.section||"A",true,["A","B","C","D","E"])+field("teacher","Class teacher","select",x.teacher||"",false,teacherOpts)+field("room","Room number (optional)","text",x.room)+field("status","Status","select",x.status||"Active",true,["Active","Inactive"]);}
 if(kind==="timetable"){f+=field("grade","Class","select",x.grade||"Class 8",true,classOpts)+field("section","Division","select",x.section||"A",true,["A","B","C","D","E"])+field("day","Weekday","select",x.day||"Monday",true,DAYS)+field("period","Period number","select",x.period||"1",true,["1","2","3","4","5","6","7","8","9"])+field("start","Start time","time",x.start||"09:00",true)+field("end","End time","time",x.end||"09:45",true)+field("subject","Subject","select",x.subject||"Mathematics",true,SUBJECTS)+field("teacher","Teacher","select",x.teacher||"",false,teacherOpts)+field("room","Classroom","text",x.room||"");}
 if(kind==="exams"){f+=field("name","Exam name","text",x.name||"",true)+field("term","Term","select",x.term||"1",true,["1","2","3"])+field("year","Academic year","text",x.year||load().school.year,true)+field("status","Status","select",x.status||"Upcoming",true,["Upcoming","Active","Completed"]);}
 if(kind==="marks"){if(!load().exams.length)return '<p>Create an exam first.</p>';var eo=load().exams.map(function(v){return [v.id,v.name+" · "+v.year];}),so=records.Students.map(function(v){return [v.id,v.name+" · "+(v.admissionNo||v.grade)];});if(!so.length)return "<p>Add a student first.</p>";
 f+=field("examId","Exam","select",x.examId||eo[0][0],true,eo)+field("studentId","Student","select",x.studentId||so[0][0],true,so)+field("subject","Subject","select",x.subject||"Mathematics",true,SUBJECTS)+field("max","Maximum marks","number",x.max==null?100:x.max,true)+field("score","Marks obtained","number",x.score==null?"":x.score,true);}
 return f;
}
function modal(kind,id){
 var all=assure(kind),obj=id?all.find(function(x){return x.id===id;}):null;
 if(id&&!obj){alert("This record was not found.");return;}
 var titles={Teachers:"teacher",Parents:"parent / guardian",classes:"class section",timetable:"timetable period",exams:"exam",marks:"student marks"};
 var form=editForm(kind,obj);
 var old=document.getElementById("lavModal");if(old)old.remove();
 var shell=document.createElement("div");shell.id="lavModal";shell.className="lav-modal-shell";
 shell.innerHTML='<div class="lav-modal glass" role="dialog" aria-modal="true" aria-labelledby="lavModalTitle"><div class="lav-modal-head"><div><span class="lav-eyebrow">LAV SMS · DEMO RECORD</span><h2 id="lavModalTitle">'+(obj?"Edit ":"Add ")+text(titles[kind]||kind)+'</h2></div><button type="button" class="lav-x" id="lavModalClose" aria-label="Close">✕</button></div><form id="lavForm"><div class="lav-fields">'+form+'</div><div class="lav-modal-foot"><button type="button" class="btn secondary" id="lavModalCancel">Cancel</button><button class="btn" type="submit">Save record</button></div></form></div>';
 document.body.appendChild(shell);
 document.getElementById("lavModalClose").onclick=closeModal;document.getElementById("lavModalCancel").onclick=closeModal;
 shell.onclick=function(e){if(e.target===shell)closeModal();};
 document.getElementById("lavForm").onsubmit=function(e){
  e.preventDefault();
  var fd=new FormData(e.currentTarget);var data={};
  for(var pair of fd.entries())data[pair[0]]=String(pair[1]).trim();
  if(!validate(kind,data,obj))return;
  var next=Object.assign({},obj||{},data,{id:obj?obj.id:uid(kind.toLowerCase()),status:data.status||(obj&&obj.status)||"Active"});
  if(kind==="marks"){next.score=Number(data.score);next.max=Number(data.max);}
  if(kind==="Teachers")next.subject=next.detail;
  var list=assure(kind),idx=obj?list.findIndex(function(x){return x.id===obj.id;}):-1;
  if(idx>=0)list[idx]=next;else list.push(next);
  persist(kind);closeModal();render();
 };
 if(kind==="marks"&&window.LavSearch)window.LavSearch.attachStudentPicker("lav-field-studentId");var first=shell.querySelector("input,select");if(first)first.focus();
}
function closeModal(){var x=document.getElementById("lavModal");if(x)x.remove();}
function validate(kind,data,obj){
 if(kind==="Teachers"||kind==="Parents"){if(!data.name){alert("Please enter a name.");return false;}}
 if(kind==="classes"){
  if(obj&&(obj.name!==data.name||obj.section!==data.section)&&(
      records.Students.some(s=>s.grade===obj.name&&s.section===obj.section)||
      load().timetable.some(t=>t.grade===obj.name&&t.section===obj.section)
  )){alert("This section has linked students or timetable periods. Move those records first; only update its teacher or room.");return false;}
  if(load().classes.some(function(c){return c.id!==(obj&&obj.id)&&norm(c.name)===norm(data.name)&&norm(c.section)===norm(data.section);})){alert("This class and division already exist.");return false;}
 }
 if(kind==="Teachers"&&obj&&obj.name!==data.name){
  if(load().classes.some(c=>c.teacher===obj.name)||load().timetable.some(t=>t.teacher===obj.name)){alert("This teacher is assigned to classes or timetable periods. Update assignments before renaming.");return false;}
 }
 if(kind==="timetable"){
  if(!load().classes.some(c=>c.name===data.grade&&c.section===data.section&&c.status!=="Inactive")){alert("Select an active class section first.");return false;}
  if(data.start>=data.end){alert("The end time must be later than the start time.");return false;}
  var clash=load().timetable.some(function(x){return x.id!==(obj&&obj.id)&&x.day===data.day&&x.grade===data.grade&&x.section===data.section&&data.start<x.end&&x.start<data.end;});
  if(clash){alert("This class already has a period at that time. Choose a different slot.");return false;}
 }
 if(kind==="marks"){
  if(!records.Students.some(s=>s.id===data.studentId)){alert("Select a valid student.");return false;}
  if(!load().exams.some(e=>e.id===data.examId)){alert("Select an existing exam.");return false;}
  if(!Number.isFinite(Number(data.max))||Number(data.max)<=0||!Number.isFinite(Number(data.score))||data.score===""||Number(data.score)<0||Number(data.score)>Number(data.max)){alert("Marks must be between 0 and the maximum.");return false;}
  if(load().marks.some(function(x){return x.id!==(obj&&obj.id)&&x.examId===data.examId&&x.studentId===data.studentId&&norm(x.subject)===norm(data.subject);})){alert("Marks already exist for this student, exam and subject. Edit the existing entry.");return false;}
 }
 return true;
}
function remove(kind,id){
 var arr=assure(kind),obj=arr.find(function(x){return x.id===id;});if(!obj)return;
 if(kind==="classes"&&(records.Students.some(function(s){return s.grade===obj.name&&s.section===obj.section;})||load().timetable.some(function(t){return t.grade===obj.name&&t.section===obj.section;}))){alert("Move students from this class before deleting it.");return;}
 if(kind==="Teachers"&&(load().classes.some(c=>c.teacher===obj.name)||load().timetable.some(t=>t.teacher===obj.name))){alert("Teacher is assigned to a class or timetable; remove assignments first.");return;}
 if(kind==="exams"&&load().marks.some(function(m){return m.examId===id;})){alert("Delete the marks associated with this exam first.");return;}
 if(!confirm("Delete this "+kind+" demo record? This cannot be undone in this browser."))return;
 var i=arr.indexOf(obj);arr.splice(i,1);persist(kind);render();
}
function settings(){
 var s=load().school;return header("School settings","Update the display details used throughout this browser demo.","")
  +'<section class="glass panel lav-settings"><form id="lavSettingsForm"><div class="lav-fields">'
  +field("name","Official school name","text",s.name,true)
  +field("year","Academic year","text",s.year,true)
  +field("address","School address","text",s.address,true)
  +field("principal","Principal / head","text",s.principal)
  +field("phone","Contact number","tel",s.phone)
  +field("email","School email","email",s.email)
  +field("receiptPrefix","Receipt prefix","text",s.receiptPrefix)
  +'</div><div class="lav-modal-foot"><button class="btn" type="submit">Save school profile</button></div></form>'
  +'<div class="lav-settings-note"><b>About this preview</b><p>This version runs on GitHub Pages. Settings, student data, fees, and academic records remain on this device. Real multi-user logins, a central database, messaging, and permission controls require a separately hosted backend.</p></div></section>';
}
function download(name,body,mime){
 var blob=new Blob([body],{type:mime||"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function dataset(which){
 var a=load();switch(which){
 case "students":return records.Students.map(function(x){return {admission_no:x.admissionNo,name:x.name,class:x.grade,section:x.section,parent:x.parent,phone:x.phone,status:x.status};});
 case "teachers":return records.Teachers.map(function(x){return {name:x.name,subject:x.detail,phone:x.phone,email:x.email,status:x.status};});
 case "parents":return records.Parents.map(function(x){return {name:x.name,phone:x.phone,email:x.email,notes:x.detail,status:x.status};});
 case "classes":return a.classes;
 case "timetable":return a.timetable;
 case "exams":return a.exams;
 case "marks":return a.marks.map(function(m){var s=records.Students.find(function(x){return x.id===m.studentId;});var e=a.exams.find(function(x){return x.id===m.examId;});return {student:s&&s.name,admission_no:s&&s.admissionNo,exam:e&&e.name,subject:m.subject,score:m.score,maximum:m.max,grade:gradeFor(m.score,m.max)};});
 case "attendance":return loadAttendanceSessions().map(function(x){return {date:x.date,class:x.grade,section:x.section,teacher:x.teacher,subject:x.subject,present:x.present,absent:x.absent,total:x.total};});
 case "receipts":return loadFeeReceipts().map(function(x){return {receipt_no:x.receiptNo,student:x.studentName,admission_no:x.admissionNo,date:x.paymentDate,fee_items:(x.feeItems||[]).map(function(v){return v.name;}).join("; "),paid:x.amountPaid,balance:x.remainingBalance,payment_mode:x.paymentMode,transaction_id:x.transactionId};});
 }return [];
}
function exportCSV(which){
 var rows=dataset(which);
 if(!rows.length){alert("There are no "+which+" records to export yet.");return;}
 var cols=Object.keys(rows[0]);var csv=[cols.join(",")].concat(rows.map(function(row){return cols.map(function(k){var v=String(row[k]??"");if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}).join(",");})).join("\r\n");
 download("LAV_SMS_"+which+"_"+dateToday()+".csv","\uFEFF"+csv,"text/csv;charset=utf-8");
}
function backup(){
 var keys=["lavsms-demo-records","lavsms-attendance-history-v1","lavsms-fee-receipts-v1","lavsms-certificates-v1","lavsms-student-history-v1",KEY];
 var out={format:"LAVSMSBrowserDemoBackup",version:1,createdAt:new Date().toISOString(),items:{}};
 keys.forEach(function(k){out.items[k]=localStorage.getItem(k);});
 download("LAV_SMS_DEMO_BACKUP_"+dateToday()+".json",JSON.stringify(out,null,2),"application/json");
}
function restore(file){
 if(!file)return;
 if(file.size>8*1024*1024){alert("Backup too large for this browser demo.");return;}
 var rd=new FileReader();rd.onload=function(){
  try{
   var data=JSON.parse(rd.result);if(!data||data.format!=="LAVSMSBrowserDemoBackup"||data.version!==1||!data.items||typeof data.items!=="object")throw Error("Not a valid demo backup.");
   var keys=["lavsms-demo-records","lavsms-attendance-history-v1","lavsms-fee-receipts-v1","lavsms-certificates-v1","lavsms-student-history-v1",KEY];
   if(!confirm("Restore this backup? It will replace the current browser demo data."))return;
   keys.forEach(function(k){var v=data.items[k];if(v===null||v===undefined)localStorage.removeItem(k);else if(typeof v==="string"){JSON.parse(v);localStorage.setItem(k,v);}});
   alert("Demo backup restored. The portal will reload.");location.reload();
  }catch(err){alert("Backup import failed: "+err.message);}
 };
 rd.readAsText(file);
}
function printMarksFor(studentId,examId){
 var id=String(studentId||value("lavMarkStudent"));
 var selectedExam=examId||value("lavMarkExam")||"";
var student=records.Students.find(function(x){return x.id===id;});if(!student){alert("Select a student.");return;}
 var d=load(),marks=d.marks.filter(function(x){return x.studentId===id&&(!selectedExam||x.examId===selectedExam);}),sum=marks.reduce(function(a,x){a[0]+=Number(x.score);a[1]+=Number(x.max);return a;},[0,0]);
 if(!marks.length){alert("No exam marks are saved for this student.");return;}
 var rows=marks.map(function(x,i){var e=d.exams.find(function(ex){return ex.id===x.examId;});return "<tr><td>"+(i+1)+"</td><td>"+text(e&&e.name||"—")+"</td><td>"+text(x.subject)+"</td><td>"+text(x.max)+"</td><td>"+text(x.score)+"</td><td>"+gradeFor(x.score,x.max)+"</td></tr>";}).join("");
 var html='<!doctype html><html><head><title>Demo Marksheet · '+text(student.name)+'</title><style>body{font:14px Arial,sans-serif;padding:25px;color:#163151}h1{text-align:center;margin:0}header{text-align:center;border-bottom:2px solid #163151;padding-bottom:18px}h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:25px}td,th{border:1px solid #cbd5e1;padding:11px;text-align:left}th{background:#eaf0fa}.note{color:#a05a16}.foot{display:flex;justify-content:space-between;margin-top:60px}button{padding:10px;margin-top:20px}@media print{button{display:none}}</style></head><body><header><h1>'+text(d.school.name)+'</h1><p>'+text(d.school.address)+'</p></header><h2>STUDENT RESULT / MARKSHEET — DEMO</h2><p><b>Exam:</b> '+text(d.exams.find(function(e){return e.id===selectedExam;})?.name||"All recorded exams") +'</p><p><b>Name:</b> '+text(student.name)+' &nbsp; <b>Admission:</b> '+text(student.admissionNo)+'<br><b>Class:</b> '+text(student.grade)+' · '+text(student.section)+' &nbsp; <b>Year:</b> '+text(d.school.year)+'</p><table><thead><tr><th>#</th><th>Exam</th><th>Subject</th><th>Maximum</th><th>Obtained</th><th>Grade</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><th colspan="3">Total</th><th>'+sum[1]+'</th><th>'+sum[0]+'</th><th>'+gradeFor(sum[0],sum[1])+'</th></tr></tfoot></table><p><b>Overall percentage:</b> '+(sum[1]?((sum[0]/sum[1])*100).toFixed(1):"0")+'%</p><p class="note">SAMPLE / DEMONSTRATION MARKSHEET — NOT AN OFFICIAL SCHOOL RECORD</p><div class="foot"><span>Class Teacher Signature</span><span>Principal Signature</span></div><button onclick="window.print()">Print / Save PDF</button></body></html>';
 var w=window.open("","_blank","width=900,height=740");if(!w){alert("Allow pop-ups to print.");return;}w.document.write(html);w.document.close();
}
function printMarks(){printMarksFor(value("lavMarkStudent"),value("lavMarkExam"));}
function renderEnhancedPage(page){
 load();if(page==="Overview")return overview();
 if(page==="Teachers")return teachers();
 if(page==="Classes")return classes();
 if(page==="Timetable")return timetable();
 if(page==="Exams & Marks")return exams();
 if(page==="Parents")return parents();
 if(page==="Reports")return reports();
 if(page==="Settings")return settings();
 return null;
}
function bindEnhancedPage(page){
 if(!["Overview","Teachers","Classes","Timetable","Exams & Marks","Parents","Reports","Settings"].includes(page))return;
 document.querySelectorAll("#content [data-lav-action]").forEach(function(el){el.onclick=function(){
  var a=el.dataset.lavAction,kind=el.dataset.lavKind,id=el.dataset.lavId;
  if(a==="add"||a==="edit")modal(kind,id);
  if(a==="delete")remove(kind,id);
  if(a==="csv")exportCSV(kind);
  if(a==="backup")backup();
  if(a==="print-marks")printMarks();
 };});
 if(page==="Exams & Marks"&&window.LavSearch)window.LavSearch.attachStudentPicker("lavMarkStudent");
 var form=document.getElementById("lavSettingsForm");
 if(form)form.onsubmit=function(e){e.preventDefault();var data={};for(var x of new FormData(form).entries())data[x[0]]=String(x[1]).trim();if(!data.name||!data.address||!data.year){alert("School name, year and address are required.");return;}Object.assign(load().school,data);if(save()){alert("School details saved in this browser demo.");render();}};
 var restoreInput=document.getElementById("lavRestoreInput");
 if(restoreInput)restoreInput.onchange=function(){restore(restoreInput.files[0]);};
}
window.LavAcademicData={school:()=>load().school,classes:()=>load().classes,exams:()=>load().exams,marks:()=>load().marks,exportCSV,printMarksFor};
window.renderEnhancedPage=renderEnhancedPage;
window.bindEnhancedPage=bindEnhancedPage;
})();
