(function(){
"use strict";
const keys={people:"lavsms-demo-records",academic:"lavsms-academic-suite-v2",attendance:"lavsms-attendance-history-v1",fees:"lavsms-fee-receipts-v1",certificates:"lavsms-certificates-v1"};
const el=id=>document.getElementById(id);
const read=(key,fallback)=>{try{let x=localStorage.getItem(key);return x?JSON.parse(x):fallback}catch(e){return fallback}};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=x=>String(x??"").trim().toLowerCase();
const money=x=>Number(x||0).toLocaleString("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
const fmt=x=>{if(!x)return "—";let d=new Date(String(x).slice(0,10)+"T12:00:00");return isNaN(d.valueOf())?esc(x):d.toLocaleDateString("en-IN")};
const first=["Aarav","Ananya","Vihaan","Saanvi","Aditya","Aadhya","Arjun","Isha","Reyansh","Myra","Atharv","Kavya","Vivaan","Diya","Advait","Sara","Ishaan","Riya","Shaurya","Aanya","Kabir","Pari","Rudra","Meera","Om","Tanvi","Dhruv","Nitya","Vedant","Siya"];
const last=["Patil","Shah","Joshi","Deshmukh","Kulkarni","Jadhav","Pawar","More","Shinde","Chavan","Gaikwad","Bhosale","Kadam","Mane","Sawant","Naik","Gokhale","Apte","Nair","Mehta","Gupta","Suryawanshi","Salunkhe","Ingale","Wagh","Thakur","Khot","Pathak","Patwardhan","Dandekar"];
let guardian="",childId="",tab="overview",query="";
const pages={overview:"Overview",attendance:"Attendance",marks:"Results & Marks",timetable:"Timetable",fees:"Fee Receipts",certificates:"Certificates"};
function students(){
 let stored=read(keys.people,null);if(stored&&Array.isArray(stored.Students))return stored.Students;
 let arr=[];["A","B","C","D"].forEach((section,k)=>{for(let i=0;i<30;i++){let num=String(i+1).padStart(3,"0");arr.push({id:"demo-"+section+"-"+num,admissionNo:"LAV-"+section+"-"+num,name:first[(i+k*8)%30]+" "+last[(i*7+k*9)%30],grade:"Class 8",section,parent:"Demo parent "+num,status:"Active"});}});
 return arr;
}
function academics(){let x=read(keys.academic,{});return {school:x.school||{},exams:Array.isArray(x.exams)?x.exams:[],marks:Array.isArray(x.marks)?x.marks:[],timetable:Array.isArray(x.timetable)?x.timetable:[]};}
function guardians(){
 let m=new Map();students().filter(s=>s.status!=="Inactive").forEach(s=>{let g=String(s.parent||"").trim();if(!g)return;let k=norm(g);if(!m.has(k))m.set(k,{name:g,children:[]});m.get(k).children.push(s);});return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
function children(){return students().filter(s=>norm(s.parent)===norm(guardian)&&s.status!=="Inactive")}
function student(){return children().find(s=>String(s.id)===String(childId))||children()[0]}
function attend(s){let list=read(keys.attendance,[]);return (Array.isArray(list)?list:[]).filter(a=>Array.isArray(a.students)&&a.students.some(x=>String(x.id)===String(s.id))).map(a=>({date:a.date,subject:a.subject||"—",lecture:a.lecture||"—",teacher:a.teacher||"—",status:a.students.find(x=>String(x.id)===String(s.id)).status||"—"})).sort((a,b)=>String(b.date).localeCompare(String(a.date)))}
function marks(s){return academics().marks.filter(m=>String(m.studentId)===String(s.id))}
function feeReceipts(s){let a=read(keys.fees,[]);return(Array.isArray(a)?a:[]).filter(r=>String(r.studentId||"")===String(s.id)||(!r.studentId&&r.admissionNo&&norm(r.admissionNo)===norm(s.admissionNo))).sort((a,b)=>String(b.createdAt||b.paymentDate||"").localeCompare(String(a.createdAt||a.paymentDate||"")))}
function certs(s){let a=read(keys.certificates,[]);return(Array.isArray(a)?a:[]).filter(c=>String(c.studentId||"")===String(s.id)||(!c.studentId&&norm(c.name)===norm(s.name)&&norm(c.grade)===norm(s.grade)))}
function lessons(s){return academics().timetable.filter(t=>t.grade===s.grade&&t.section===s.section)}
function metrics(s){let a=attend(s),p=a.filter(x=>x.status==="P").length,n=a.filter(x=>x.status==="A").length,r=feeReceipts(s);return{p,n,rate:p+n?Math.round(p/(p+n)*100):null,paid:r.reduce((v,x)=>v+Number(x.amountPaid||0),0),balance:r.length?Number(r[0].remainingBalance||0):null,receipts:r.length}}
function table(headers,rows,empty){return '<div class="table-wrap"><table class="data"><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+(rows||'<tr><td colspan="'+headers.length+'" class="empty">'+esc(empty||"No records found")+'</td></tr>')+'</tbody></table></div>'}
function intro(s,title,desc){return '<section class="card hero"><span class="eyebrow">PARENT CONNECT · '+esc(s.grade)+' / '+esc(s.section)+'</span><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p></section>'}
function kpi(name,value,note){return '<div class="kpi"><small>'+esc(name)+'</small><strong>'+esc(value)+'</strong><span>'+esc(note)+'</span></div>'}
function overview(s){
 let f=metrics(s),entries=attend(s).slice(0,5),ms=marks(s).slice(-5).reverse(),ex=academics().exams;
 return intro(s,"Welcome, "+guardian,s.name+" · Admission "+s.admissionNo)
 +'<div class="kpis">'+kpi("Attendance",f.rate===null?"No records":f.rate+"%",f.p+" present · "+f.n+" absent")+kpi("Payments recorded",money(f.paid),f.receipts+" receipt(s)")+kpi("Last receipt balance",f.balance===null?"No record":money(f.balance),"Not an audited balance")+kpi("Marks recorded",marks(s).length,"Subject entries")+'</div>'
 +'<div class="grid-two"><section class="card"><div class="card-head"><h3>Recent attendance</h3><button class="text-button" data-jump="attendance">View all →</button></div>'+table(["Date","Subject","Status"],entries.map(a=>'<tr><td>'+esc(fmt(a.date))+'</td><td>'+esc(a.subject)+'</td><td>'+esc(a.status==="P"?"Present":a.status==="A"?"Absent":"Unmarked")+'</td></tr>').join(""),"No recorded attendance.")+'</section>'
 +'<section class="card"><div class="card-head"><h3>Recent marks</h3><button class="text-button" data-jump="marks">View all →</button></div>'+table(["Exam","Subject","Score"],ms.map(m=>'<tr><td>'+esc(ex.find(e=>e.id===m.examId)?.name||"Exam")+'</td><td>'+esc(m.subject)+'</td><td>'+esc(m.score)+' / '+esc(m.max)+'</td></tr>').join(""),"No marks recorded.")+'</section></div><p class="notice">This demo reads data saved on this browser. It does not provide real parent authentication or synchronize records between devices.</p>';
}
function attendancePage(s){
 let f=metrics(s),a=attend(s).filter(x=>!query||[x.date,x.subject,x.teacher].join(" ").toLowerCase().includes(norm(query)));
 return intro(s,"Attendance",s.name+"'s saved attendance sessions.")+'<div class="kpis">'+kpi("Present",f.p,"Recorded")+kpi("Absent",f.n,"Recorded")+kpi("Attendance rate",f.rate===null?"—":f.rate+"%","Recorded sessions only")+kpi("Sessions",f.p+f.n,"Total")+'</div>'
 +'<section class="card"><div class="card-head"><h3>Attendance register</h3><input class="section-search" type="search" placeholder="Search date or subject" value="'+esc(query)+'"></div>'
 +table(["Date","Subject","Lecture","Teacher","Status"],a.map(x=>'<tr><td>'+esc(fmt(x.date))+'</td><td>'+esc(x.subject)+'</td><td>'+esc(x.lecture)+'</td><td>'+esc(x.teacher)+'</td><td><span class="badge '+(x.status==="A"?"absent":"")+'">'+esc(x.status==="P"?"Present":x.status==="A"?"Absent":"Unmarked")+'</span></td></tr>').join(""),"No attendance sessions saved yet.")+'</section>';
}
function marksPage(s){
 let ex=academics().exams,all=marks(s).map(x=>({...x,exam:ex.find(e=>e.id===x.examId)?.name||"Unknown exam"})),a=all.filter(x=>!query||[x.exam,x.subject].join(" ").toLowerCase().includes(norm(query))),total=all.reduce((v,x)=>v+Number(x.score||0),0),max=all.reduce((v,x)=>v+Number(x.max||0),0);
 return intro(s,"Exam results","Subject-wise scores recorded for "+s.name)+
 '<div class="kpis">'+kpi("Subject entries",all.length,"Recorded")+kpi("Score total",total+" / "+max,"Across multiple exams")+kpi("Aggregate rate",max?(total/max*100).toFixed(1)+"%":"—","Not an official grade")+kpi("Exams",new Set(all.map(x=>x.exam)).size,"With marks")+'</div>'
 +'<section class="card"><div class="card-head"><h3>Marks register</h3><input class="section-search" type="search" value="'+esc(query)+'" placeholder="Search subject or exam"></div>'
 +table(["Exam","Subject","Marks obtained","Maximum"],a.map(x=>'<tr><td>'+esc(x.exam)+'</td><td>'+esc(x.subject)+'</td><td>'+esc(x.score)+'</td><td>'+esc(x.max)+'</td></tr>').join(""),"No marks have been entered.")+'</section>';
}
function timetablePage(s){
 let list=lessons(s).filter(x=>!query||[x.day,x.subject,x.teacher].join(" ").toLowerCase().includes(norm(query)));
 let days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 return intro(s,"Class timetable",s.grade+" / "+s.section+" · Weekly lessons")
 +'<section class="card"><div class="card-head"><h3>Weekly schedule</h3><input type="search" class="section-search" value="'+esc(query)+'" placeholder="Find day or subject"></div><div class="timetable-grid">'
 +days.map(day=>'<div class="day"><h4>'+day+'</h4>'+(list.filter(x=>x.day===day).sort((a,b)=>String(a.start).localeCompare(String(b.start))).map(x=>'<div class="lesson"><b>'+esc(x.subject)+'</b><small>Period '+esc(x.period)+' · '+esc(x.start)+'–'+esc(x.end)+'</small><small>'+esc(x.teacher||"Teacher pending")+' · '+esc(x.room||"Room not set")+'</small></div>').join("")||'<p class="desc">No scheduled lessons.</p>')+'</div>').join("")+'</div></section>';
}
function feesPage(s){
 let r=feeReceipts(s),f=metrics(s),a=r.filter(x=>!query||[x.receiptNo,x.paymentDate,x.paymentMode,x.feeType].join(" ").toLowerCase().includes(norm(query)));
 return intro(s,"Fee receipts","View recorded fees for "+s.name+". No online payments accepted.")+'<div class="kpis">'+kpi("Payments saved",money(f.paid),r.length+" receipts")+kpi("Latest balance",f.balance===null?"No record":money(f.balance),"From last receipt")+kpi("Receipts",r.length,"Browser-local")+kpi("Payment portal","View only","No payment collection")+'</div>'
 +'<section class="card"><div class="card-head"><h3>Saved receipts</h3><input type="search" class="section-search" value="'+esc(query)+'" placeholder="Find receipt or date"></div>'
 +(a.map(x=>'<div class="receipt"><div><b>'+esc(x.receiptNo||"Receipt")+'</b><small>'+esc(fmt(x.paymentDate))+' · '+esc(x.paymentMode||"Payment method")+'</small><small>'+esc(x.feeType||"School fees")+'</small></div><div><strong>'+money(x.amountPaid)+'</strong><small>Balance '+money(x.remainingBalance)+'</small></div></div>').join("")||'<p class="desc">No receipts recorded for this child.</p>')
 +'<p class="notice">These are demo records, not bank-verified payments or an official fee statement.</p></section>';
}
function certPage(s){
 let a=certs(s).filter(x=>!query||[x.competition,x.achievement].join(" ").toLowerCase().includes(norm(query)));
 return intro(s,"Certificates","Saved student achievements for "+s.name)
 +'<section class="card"><div class="card-head"><h3>Certificate history</h3><input type="search" class="section-search" value="'+esc(query)+'" placeholder="Find competition or award"></div>'
 +table(["Event","Achievement","Date","Organiser"],a.map(x=>'<tr><td>'+esc(x.competition||"Certificate")+'</td><td>'+esc(x.achievement||"Participation")+'</td><td>'+esc(fmt(x.date))+'</td><td>'+esc(x.organiser||"School")+'</td></tr>').join(""),"No certificates saved yet.")+'</section>';
}
function render(){
 let s=student();if(!s){logout();return;}childId=s.id;
 el("heading").textContent=pages[tab];el("breadcrumb").textContent=pages[tab];
 el("childSelect").innerHTML=children().map(x=>'<option value="'+esc(x.id)+'" '+(String(x.id)===String(childId)?"selected":"")+'>'+esc(x.name)+' · '+esc(x.grade)+' / '+esc(x.section)+'</option>').join("");
 el("childSelect").onchange=e=>{childId=e.target.value;query="";render();};
 el("parentDisplay").textContent="Guardian: "+guardian;
 el("guardianInitials").textContent=guardian.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
 document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 const views={overview,attendance:attendancePage,marks:marksPage,timetable:timetablePage,fees:feesPage,certificates:certPage};
 el("content").innerHTML=views[tab](s);
 document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>go(b.dataset.jump));
 const inp=el("content").querySelector(".section-search");if(inp)inp.oninput=()=>{let pos=inp.selectionStart;query=inp.value;render();let next=el("content").querySelector(".section-search");if(next){next.focus();next.setSelectionRange(pos,pos)}};
}
function go(name){if(!pages[name])return;tab=name;query="";render();window.scrollTo({top:0,behavior:"auto"});}
function login(name){guardian=name;let kids=children();if(!kids.length){logout();return;}childId=kids[0].id;sessionStorage.setItem("nxt_parent_demo",name);el("loginScreen").hidden=true;el("app").hidden=false;go("overview");}
function logout(){guardian="";childId="";sessionStorage.removeItem("nxt_parent_demo");el("app").hidden=true;el("loginScreen").hidden=false;el("accessCode").value="";}
function fill(q=""){let list=guardians().filter(g=>!q||[g.name,...g.children.map(s=>s.name+" "+s.admissionNo)].join(" ").toLowerCase().includes(norm(q)));let old=el("guardianSelect").value;el("guardianSelect").innerHTML='<option value="">Select guardian</option>'+list.slice(0,300).map(g=>'<option value="'+esc(g.name)+'" '+(old===g.name?"selected":"")+'>'+esc(g.name)+' · '+g.children.length+' student(s)</option>').join("");}
function init(){
 fill();el("guardianSearch").oninput=e=>fill(e.target.value);
 el("toggleCode").onclick=()=>{let input=el("accessCode");input.type=input.type==="password"?"text":"password";el("toggleCode").textContent=input.type==="password"?"Show":"Hide";};
 el("loginForm").onsubmit=e=>{e.preventDefault();let name=el("guardianSelect").value;if(!guardians().some(g=>g.name===name)||el("accessCode").value!=="PARENT2026"){el("loginError").textContent="Select a guardian and enter demo code PARENT2026.";el("loginError").hidden=false;return;}el("loginError").hidden=true;login(name);};
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>go(b.dataset.tab));
 el("topLogout").onclick=logout;el("sideLogout").onclick=logout;
 let saved=sessionStorage.getItem("nxt_parent_demo");if(saved&&guardians().some(x=>x.name===saved))login(saved);
}
document.addEventListener("DOMContentLoaded",init);
})();