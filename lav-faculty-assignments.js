/* LAV SMS academic faculty allocations · browser-only demonstration. */
(function(){
"use strict";
const KEY="lavsms-academic-suite-v2";
const SUBJECTS=["English","Mathematics","Science","Social Science","Marathi","Hindi","Computer","General Knowledge","Physical Education","Art","EVS","Sanskrit","Music"];
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=x=>String(x??"").trim().toLowerCase();
const get=()=>window.LavAcademicData?.raw?.();
const all=()=>Array.isArray(get()?.facultyAssignments)?get().facultyAssignments:[];
const teachers=()=>typeof records==="undefined"?[]:records.Teachers||[];
const activeClasses=()=>get()?.classes?.filter(c=>c.status!=="Inactive")||[];
const byId=id=>teachers().find(t=>String(t.id)===String(id));
const byName=name=>teachers().find(t=>norm(t.name)===norm(name));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(get()));return true;}catch(e){alert("Browser storage could not save assignments.");return false;}}
function forTeacher(t){return all().filter(a=>String(a.teacherId)===String(t.id)||(!a.teacherId&&norm(a.teacherName)===norm(t.name)));}
function effective(t){
 const found=new Map();
 const push=(grade,section,role,subject)=>{
  const key=grade+"|"+section;
  if(!found.has(key))found.set(key,{grade,section,roles:[],subjects:[]});
  const v=found.get(key);if(!v.roles.includes(role))v.roles.push(role);
  if(subject&&!v.subjects.includes(subject))v.subjects.push(subject);
 };
 const d=get();if(!d)return[];
 d.classes.forEach(c=>{if(c.status!=="Inactive"&&norm(c.teacher)===norm(t.name))push(c.name,c.section,"Class teacher","");});
 d.timetable.forEach(a=>{if(norm(a.teacher)===norm(t.name)&&activeClasses().some(c=>c.name===a.grade&&c.section===a.section))push(a.grade,a.section,"Timetable",a.subject);});
 forTeacher(t).forEach(a=>{if(activeClasses().some(c=>c.name===a.grade&&c.section===a.section))push(a.grade,a.section,a.role,a.subject);});
 return [...found.values()];
}
function page(){
 const list=teachers(),assigned=list.filter(t=>effective(t).length>0).length,q=norm($("search")?.value);
 const staffRows=list.filter(t=>!q||[t.name,t.detail,t.email,t.phone,t.status,...effective(t).map(a=>a.grade+" "+a.section+" "+a.subjects.join(" "))].join(" ").toLowerCase().includes(q)).map(t=>{
  const found=effective(t),chips=found.slice(0,3).map(a=>'<span class="fac-chip">'+esc(a.grade)+' / '+esc(a.section)+'</span>').join("")+(found.length>3?'<span class="fac-chip">+'+(found.length-3)+'</span>':"");
  return '<tr><td><b>'+esc(t.name)+'</b><small class="fac-small">'+esc(t.email||"")+'</small></td><td>'+esc(t.detail||"—")+'</td><td>'+esc(t.phone||"—")+'</td><td><div class="fac-tags">'+(chips||'<span class="fac-subtle">Not assigned</span>')+'</div></td><td><span class="badge">'+esc(t.status||"Active")+'</span></td><td><div class="fac-actions"><button class="btn fac-open" type="button" data-fac-open="'+esc(t.id)+'" '+(t.status==="Inactive"?"disabled":"")+'>Assign classes</button><button type="button" class="fac-outline" data-fac-edit="'+esc(t.id)+'">Edit</button><button type="button" class="fac-danger" data-fac-delete="'+esc(t.id)+'">Delete</button></div></td></tr>';
 }).join("");
 const allocations=all().slice().sort((a,b)=>a.grade.localeCompare(b.grade,undefined,{numeric:true})||a.section.localeCompare(b.section));
 const rows=allocations.map(a=>{
  const t=byId(a.teacherId)||byName(a.teacherName),valid=activeClasses().some(c=>c.name===a.grade&&c.section===a.section);
  return '<tr><td><b>'+esc(a.grade)+'</b> / '+esc(a.section)+'</td><td>'+esc(t?.name||a.teacherName)+'</td><td>'+esc(a.subject)+'</td><td>'+esc(a.role)+'</td><td>'+ (valid?'Active class':'Missing class') +'</td><td><div class="fac-actions"><button type="button" class="fac-outline" data-fac-modify="'+esc(a.id)+'">Edit</button><button type="button" class="fac-danger" data-fac-remove="'+esc(a.id)+'">Remove</button></div></td></tr>';
 }).join("");
 const counters=[["Faculty records",list.length],["Faculty with classes",assigned],["Assignments",allocations.length]];
 return '<section class="glass lav-intro"><div><span class="lav-eyebrow">NXT GEN · FACULTY MANAGEMENT</span><h2>Teachers & class assignments</h2><p>Assign faculty members to class divisions, subjects and teaching roles.</p></div><div class="lav-actions"><button class="btn" type="button" data-lav-action="add" data-lav-kind="Teachers">＋ Add faculty</button><button class="btn secondary" type="button" id="facOpenAll">Assign classes</button></div></section>'
 +'<div class="fac-counters">'+counters.map(x=>'<div class="glass fac-counter"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join("")+'</div>'
 +'<section class="glass panel"><div class="fac-head"><h3>Faculty directory</h3><small>'+list.length+' faculty member(s) · Search by teacher, subject, or division</small></div><div class="tablewrap"><table class="data"><thead><tr><th>Faculty</th><th>Subject</th><th>Contact</th><th>Assigned classes</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+(staffRows||'<tr><td colspan="6" class="empty">No faculty matches your search.</td></tr>')+'</tbody></table></div></section>'
 +'<section class="glass panel"><div class="fac-head"><div><h3>Class allocation register</h3><small>Assignments created in this admin workspace</small></div><button class="btn secondary" type="button" id="facExport">↓ Export CSV</button></div><div class="tablewrap"><table class="data"><thead><tr><th>Class / division</th><th>Faculty</th><th>Subject</th><th>Role</th><th>Class status</th><th>Actions</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6" class="empty">No explicit allocations saved. Use Assign classes to begin.</td></tr>')+'</tbody></table></div><p class="fac-hint">Class-teacher links in Classes & Sections and existing timetable periods also appear in each teacher’s portal. Remove those links too when revoking access. All data is browser-local demonstration data.</p></section>';
}
function classChoices(selected){
 return activeClasses().slice().sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})||a.section.localeCompare(b.section)).map(c=>{
  const key=c.name+"|"+c.section;
  return '<label class="fac-choice"><input name="facClass" type="checkbox" value="'+esc(key)+'" '+(selected.includes(key)?"checked":"")+'><span><b>'+esc(c.name)+' · Division '+esc(c.section)+'</b><small>'+esc(c.teacher?"Class teacher: "+c.teacher:"Unassigned class teacher")+'</small></span></label>';
 }).join("");
}
function open(teacherId="",id=""){
 const current=id?all().find(x=>String(x.id)===String(id)):null;
 if(id&&!current){alert("That assignment was not found.");return;}
 const available=teachers().filter(t=>t.status!=="Inactive");
 if(!available.length){alert("Add an active faculty member first.");return;}
 if(!activeClasses().length){alert("Create a class and division first.");return;}
 const chosen=byId(current?.teacherId||teacherId)||byName(current?.teacherName)||available[0];
 const subject=current?.subject||chosen.detail||chosen.subject||"Mathematics";
 const availableSubjects=[...new Set([...SUBJECTS,...teachers().map(t=>t.detail||""),subject])].filter(Boolean);
 $("facultyModal")?.remove();
 const node=document.createElement("div");node.className="fac-overlay";node.id="facultyModal";
 node.innerHTML='<section class="fac-modal glass" role="dialog" aria-modal="true" aria-labelledby="facTitle"><div class="fac-head"><div><span class="lav-eyebrow">ADMIN · FACULTY ALLOCATION</span><h2 id="facTitle">'+(current?"Edit class assignment":"Assign classes to faculty")+'</h2></div><button class="fac-close" id="facClose" type="button">✕</button></div><p class="fac-hint">Choose one faculty member and a subject, then select the class divisions to assign. New assignments appear on the Teacher Portal in this browser.</p>'
 +'<form id="facultyForm"><div class="fac-fields"><label>Faculty member<select id="facTeacher" required>'+available.map(t=>'<option value="'+esc(t.id)+'" '+(String(t.id)===String(chosen.id)?"selected":"")+'>'+esc(t.name)+'</option>').join("")+'</select></label>'
 +'<label>Subject<select id="facSubject" required>'+availableSubjects.map(s=>'<option value="'+esc(s)+'" '+(norm(s)===norm(subject)?"selected":"")+'>'+esc(s)+'</option>').join("")+'</select></label>'
 +'<label>Teaching role<select id="facRole"><option '+(current?.role!=="Class teacher"?"selected":"")+'>Subject teacher</option><option '+(current?.role==="Class teacher"?"selected":"")+'>Class teacher</option></select></label>'
 +'<label>Find class<input type="search" id="facClassSearch" placeholder="Class, section or teacher"></label></div>'
 +'<div class="fac-choice-head"><b>Select class divisions</b><span id="facCount">0 selected</span></div>'
 +'<div class="fac-choices" id="facChoices">'+classChoices(current?[current.grade+"|"+current.section]:[])+'</div>'
 +'<p id="facError" class="fac-error" role="alert" hidden></p><div class="fac-foot"><button class="btn secondary" type="button" id="facCancel">Cancel</button><button class="btn" type="submit">'+(current?"Save changes":"Assign selected classes")+'</button></div></form></section>';
 document.body.append(node);
 const cancel=()=>node.remove();
 $("facClose").onclick=cancel;$("facCancel").onclick=cancel;node.onclick=e=>{if(e.target===node)cancel();};
 const inputs=()=>[...node.querySelectorAll('input[name="facClass"]')];
 const count=()=>{$("facCount").textContent=inputs().filter(x=>x.checked).length+" selected";};
 inputs().forEach(x=>x.onchange=count);count();
 $("facClassSearch").oninput=e=>{
  const q=norm(e.target.value);
  node.querySelectorAll(".fac-choice").forEach(x=>{x.hidden=!!q&&!norm(x.textContent).includes(q);});
 };
 $("facultyForm").onsubmit=e=>{
  e.preventDefault();
  const teacher=byId($("facTeacher").value),subject=$("facSubject").value.trim(),role=$("facRole").value;
  const picked=inputs().filter(x=>x.checked).map(x=>x.value);
  const error=message=>{const p=$("facError");p.hidden=false;p.textContent=message;};
  if(!teacher||teacher.status==="Inactive"){error("Select an active faculty member.");return;}
  if(!subject){error("Choose a subject.");return;}
  if(!picked.length){error("Select at least one class / division.");return;}
  if(current&&picked.length!==1){error("Edit one assignment at a time.");return;}
  const matches=picked.map(key=>activeClasses().find(c=>c.name+"|"+c.section===key));
  if(matches.some(c=>!c)){error("The selected class is unavailable.");return;}
  const next=all().filter(a=>a.id!==current?.id);
  for(const c of matches){
   if(next.some(a=>a.teacherId===String(teacher.id)&&a.grade===c.name&&a.section===c.section&&norm(a.subject)===norm(subject))){
    error("That teacher already teaches "+subject+" in "+c.name+" / "+c.section+".");return;
   }
  }
  if(role==="Class teacher"){
   const replacing=matches.filter(c=>c.teacher&&norm(c.teacher)!==norm(teacher.name));
   if(replacing.length&&!confirm("Replace the existing class teacher for "+replacing.map(c=>c.name+"/"+c.section).join(", ")+"? Existing timetable lessons are kept."))return;
  }
  const d=get(),backup=JSON.stringify(d);
  const selectedMatches=new Set(matches.map(c=>c.name+"|"+c.section));
  if(current?.role==="Class teacher"){
   const oldClass=d.classes.find(c=>c.name===current.grade&&c.section===current.section);
   if(oldClass&&norm(oldClass.teacher)===norm(current.teacherName)&&!(role==="Class teacher"&&selectedMatches.has(oldClass.name+"|"+oldClass.section)&&norm(teacher.name)===norm(current.teacherName)))oldClass.teacher="";
  }
  for(const c of matches){
   if(role==="Class teacher"){
    c.teacher=teacher.name;
    for(let i=next.length-1;i>=0;i--)if(next[i].grade===c.name&&next[i].section===c.section&&next[i].role==="Class teacher"&&next[i].teacherId!==String(teacher.id))next.splice(i,1);
   }
  }
  d.facultyAssignments=[...next,...matches.map(c=>({id:current?.id||"fac-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),teacherId:String(teacher.id),teacherName:teacher.name,grade:c.name,section:c.section,subject,role,createdAt:current?.createdAt||new Date().toISOString()}))];
  if(!persist()){Object.assign(d,JSON.parse(backup));return;}
  if(typeof saveRecords==="function")saveRecords();
  cancel();if(typeof render==="function")render();
 };
}
function remove(id){
 const d=get(),target=all().find(a=>String(a.id)===String(id));if(!target)return;
 if(!confirm("Remove "+target.teacherName+" from "+target.grade+" / "+target.section+" · "+target.subject+"?"))return;
 const backup=JSON.stringify(d);
 d.facultyAssignments=all().filter(a=>String(a.id)!==String(id));
 if(target.role==="Class teacher"){
  const c=d.classes.find(c=>c.name===target.grade&&c.section===target.section);
  if(c&&norm(c.teacher)===norm(target.teacherName))c.teacher="";
 }
 if(!persist()){Object.assign(d,JSON.parse(backup));return;}
 if(typeof render==="function")render();
}
function exportCSV(){
 const csv=[["Faculty","Class","Division","Subject","Role"],...all().map(a=>[a.teacherName,a.grade,a.section,a.subject,a.role])].map(row=>row.map(value=>{
  let text=String(value??"");if(/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';
 }).join(",")).join("\r\n");
 const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="NXTGEN_faculty_class_assignments.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function bind(){
 $("facOpenAll")?.addEventListener("click",()=>open());
 $("facExport")?.addEventListener("click",exportCSV);
 document.querySelectorAll("[data-fac-open]").forEach(b=>b.onclick=()=>open(b.dataset.facOpen));
 document.querySelectorAll("[data-fac-edit]").forEach(b=>b.onclick=()=>window.LavAcademicData?.editFaculty?.(b.dataset.facEdit));
 document.querySelectorAll("[data-fac-delete]").forEach(b=>b.onclick=()=>window.LavAcademicData?.removeFaculty?.(b.dataset.facDelete));
 document.querySelectorAll("[data-fac-modify]").forEach(b=>b.onclick=()=>open("",b.dataset.facModify));
 document.querySelectorAll("[data-fac-remove]").forEach(b=>b.onclick=()=>remove(b.dataset.facRemove));
}
window.LavFacultyAssignments={page,bind,open,remove,effective,forTeacher,all,exportCSV};
})();