/* Universal module search and searchable student pickers for the LAV SMS
   GitHub Pages demo. Local-only; does not send school records to a server. */
(function(){
"use strict";
const PAGE_HINTS={
 "Overview":"Find a student, receipt, teacher or school module",
 "Students":"Search students by name, admission number, class, parent or phone",
 "Teachers":"Search teachers by name, subject, phone or email",
 "Classes":"Search class, section, room or class teacher",
 "Attendance":"Search students by name or admission number",
 "Timetable":"Search timetable by class, subject, day, period or teacher",
 "Exams & Marks":"Search exams, students, subjects or marks",
 "Fees":"Search receipts by student, admission number, date, type or number",
 "Certificates":"Search saved certificates or student names",
 "Parents":"Search parents by name, phone, email or linked student",
 "Reports":"Search attendance reports by date, class, subject or teacher",
 "Settings":"Find a school setting by its name"
};
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function byId(id){return document.getElementById(id);}
function searchValue(){return byId("search")?.value||"";}
function toolbar(page){
 const hint=PAGE_HINTS[page]||"Search this section";
 return '<div class="lav-search-toolbar glass"><span class="lav-search-icon" aria-hidden="true">⌕</span><label class="lav-search-field"><span>SEARCH · '+esc(page.toUpperCase())+'</span><input type="search" id="lavModuleSearch" autocomplete="off" aria-label="'+esc(hint)+'" placeholder="'+esc(hint)+'" value="'+esc(searchValue())+'"></label><button class="lav-search-clear" type="button" id="lavClearSearch" aria-label="Clear search">Clear</button></div>';
}
function restoreFocus(id,position){
 const input=byId(id);
 if(input){input.focus({preventScroll:true});const len=input.value.length;try{input.setSelectionRange(Math.min(position,len),Math.min(position,len));}catch(e){}}
}
function filterCertificateHistory(q){
 const query=q.trim().toLocaleLowerCase(),rows=document.querySelectorAll("[data-cert-history]");
 let shown=0;
 rows.forEach(row=>{const ok=!query||row.textContent.toLocaleLowerCase().includes(query);row.hidden=!ok;if(ok)shown++;});
 const count=byId("certHistoryCount");if(count&&rows.length)count.textContent=shown+" of "+rows.length+" saved certificates shown";
}
function filterSettings(q){
 const query=q.trim().toLocaleLowerCase();
 const inputs=document.querySelectorAll(".lav-settings .lav-field");
 let shown=0;inputs.forEach(field=>{const ok=!query||field.querySelector("span")?.textContent.toLocaleLowerCase().includes(query);field.hidden=!ok;if(ok)shown++;});
 const result=byId("lavSearchResult");
 if(result)result.textContent=shown+(shown===1?" setting":" settings")+" shown";
}
function filterReportRows(q){
 const query=q.trim().toLocaleLowerCase();
 const tables=document.querySelectorAll("#content .lav-table tbody");
 let shown=0;
 tables.forEach(tbody=>tbody.querySelectorAll("tr").forEach(row=>{
  if(row.querySelector(".empty"))return;
  const ok=!query||row.textContent.toLocaleLowerCase().includes(query);
  row.hidden=!ok;if(ok)shown++;
 }));
 const result=byId("lavSearchResult");
 if(result)result.textContent=shown+" attendance records shown";
}
function bind(page){
 const input=byId("lavModuleSearch"),top=byId("search");
 if(!input||!top)return;
 const clear=byId("lavClearSearch");
 function doSearch(query,position,refocus){
  top.value=query;
  if(page==="Attendance"){
   if(typeof filterAttendanceRows==="function")filterAttendanceRows();
  }else if(page==="Certificates"){
   filterCertificateHistory(query);
  }else if(page==="Settings"){
   filterSettings(query);
  }else if(page==="Reports"){
   filterReportRows(query);
  }else if(page==="Overview"){
   // The overview search opens matching students and receipts below the toolbar.
   showOverviewResults(query);
  }else{
   if(typeof render==="function")render();
   if(refocus)restoreFocus("lavModuleSearch",position);
  }
 }
 input.oninput=()=>doSearch(input.value,input.selectionStart,true);
 if(clear)clear.onclick=()=>{
  input.value="";doSearch("",0,true);
  if(page==="Attendance"||page==="Certificates"||page==="Settings"||page==="Reports"||page==="Overview")input.focus();
 };
 if(page==="Certificates")filterCertificateHistory(input.value);
 if(page==="Settings")filterSettings(input.value);
 if(page==="Reports")filterReportRows(input.value);
 if(page==="Overview")showOverviewResults(input.value);
}
function showOverviewResults(query){
 let holder=byId("lavOverviewSearchResults");
 if(!holder){holder=document.createElement("div");holder.id="lavOverviewSearchResults";holder.className="glass lav-quick-results";const bar=byId("lavModuleSearch")?.closest(".lav-search-toolbar");if(bar)bar.insertAdjacentElement("afterend",holder);}
 if(!holder)return;
 const q=query.trim().toLocaleLowerCase();
 if(!q){holder.hidden=true;holder.innerHTML="";return;}
 const rs=(typeof records!=="undefined"&&records.Students)||[];
 const found=rs.filter(s=>[s.name,s.admissionNo,s.grade,s.section,s.parent].join(" ").toLowerCase().includes(q)).slice(0,15);
 const receipts=(typeof loadFeeReceipts==="function"?loadFeeReceipts():[]).filter(r=>[r.studentName,r.receiptNo,r.feeType].join(" ").toLowerCase().includes(q)).slice(0,8);
 const links=found.map(s=>'<button data-lav-go="Students" data-lav-quick="'+esc(s.id)+'"><b>'+esc(s.name)+'</b><small>Student · '+esc(s.admissionNo)+' · '+esc(s.grade)+'</small></button>').join("")
 +receipts.map(r=>'<button data-lav-go="Fees"><b>'+esc(r.studentName)+'</b><small>Fee receipt · '+esc(r.receiptNo)+'</small></button>').join("");
 holder.hidden=false;
 holder.innerHTML='<div class="lav-quick-head"><b>Search results</b><small>'+ (found.length+receipts.length)+' matches</small></div>'+(links||'<p>No matching students or receipts in this browser.</p>');
 holder.querySelectorAll("[data-lav-go]").forEach(btn=>btn.onclick=()=>{
  const page=btn.dataset.lavGo;
  const top=byId("search");if(top)top.value=q;
  if(typeof window.setSchoolDemoPage==="function")window.setSchoolDemoPage(page,q);
 });
}
function attachStudentPicker(selectId){
 const select=byId(selectId);
 if(!select||select.dataset.lavSearchAttached)return;
 select.dataset.lavSearchAttached="1";
 const container=document.createElement("div");container.className="lav-student-finder";
 const input=document.createElement("input");
 input.type="search";input.className="lav-student-finder-input";
 input.placeholder="Search student name, admission no. or class…";
 input.autocomplete="off";input.setAttribute("aria-label","Search and select a student");
 input.id=selectId+"Search";
 const results=document.createElement("div");results.className="lav-student-finder-results";results.id=selectId+"SearchResults";results.hidden=true;
 container.append(input,results);
 select.parentNode.insertBefore(container,select);
 let timer;
 function clearResults(){results.hidden=true;results.innerHTML="";}
 function students(){
  return (typeof records!=="undefined"&&records.Students||[]).filter(s=>{
   return [...select.options].some(o=>o.value===String(s.id));
  });
 }
 function draw(){
  const q=input.value.trim().toLowerCase();
  const found=students().filter(s=>!q||[s.name,s.admissionNo,s.grade,s.section,s.parent].join(" ").toLowerCase().includes(q));
  results.innerHTML='<div class="lav-finder-count">'+found.length+" matching students"+(found.length>15?" · showing first 15":"")+'</div>'
   +found.slice(0,15).map(s=>'<button type="button" data-lav-student="'+esc(s.id)+'"><b>'+esc(s.name||"Student")+'</b><small>'+esc(s.admissionNo||"No admission no.")+' · '+esc(s.grade||"Class")+' / '+esc(s.section||"A")+'</small></button>').join("")
   +(found.length?"":'<div class="lav-finder-empty">No students match. Try a different name or admission number.</div>');
  results.hidden=false;
  results.querySelectorAll("button[data-lav-student]").forEach(b=>b.onclick=()=>{
    select.value=b.dataset.lavStudent;
    const choice=students().find(s=>String(s.id)===String(select.value));
    input.value=choice?choice.name+" · "+(choice.admissionNo||""):"";
    clearResults();
    select.dispatchEvent(new Event("change",{bubbles:true}));
  });
 }
 input.addEventListener("input",draw);
 input.addEventListener("focus",()=>{draw();});
 input.addEventListener("keydown",e=>{
  if(e.key==="Escape")clearResults();
  if(e.key==="Enter"&&!results.hidden){
   const btn=results.querySelector("button[data-lav-student]");
   if(btn){e.preventDefault();btn.click();}
  }
 });
 select.addEventListener("change",()=>{const s=students().find(x=>String(x.id)===String(select.value));if(s){input.value=s.name+" · "+(s.admissionNo||"");clearResults();}});
 input.addEventListener("blur",()=>{clearTimeout(timer);timer=setTimeout(clearResults,250);});
}
function bindBulkStudentSearch(){
 const field=byId("certBulkSearch"),list=byId("certBulkList");
 if(!field||!list)return;
 field.oninput=()=>{
  // Native bulk selection redraw is bound by the certificate module.
  const grade=byId("certBulkGrade");if(grade)grade.dispatchEvent(new Event("change",{bubbles:true}));
 };
}
window.LavSearch={toolbar,bind,attachStudentPicker,bindBulkStudentSearch,filterCertificateHistory};
})();