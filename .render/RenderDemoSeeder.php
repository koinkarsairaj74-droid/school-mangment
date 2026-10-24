<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

/** Fictional school data ONLY — never run on production student records. */
class RenderDemoSeeder extends Seeder {
 public function run() {
  $secret=(string)env('DEMO_ADMIN_PASSWORD','');
  if(strlen($secret)<16) throw new RuntimeException('DEMO_ADMIN_PASSWORD must be private, 16+ characters.');
  if(DB::table('users')->where('username','schooladmin')->exists()) return;
  if(DB::table('users')->exists()) throw new RuntimeException('Database is not empty; refusing demo initialization.');
  DB::transaction(function() use($secret) {
   $now=now(); $session='2026-2027';
   $settings=[
    'current_session'=>$session,'system_title'=>'NXT','system_name'=>'NXT GEN ENGLISH SCHOOL',
    'term_ends'=>'2027-03-31','term_begins'=>'2026-06-15','phone'=>'0000000000',
    'address'=>'Dream City Nagar, Appawadi, Pune, Maharashtra','system_email'=>'demo@example.invalid',
    'alt_email'=>'','email_host'=>'','email_pass'=>'','lock_exam'=>'0','logo'=>'',
    'next_term_fees_j'=>'15000','next_term_fees_pn'=>'15000','next_term_fees_p'=>'15000',
    'next_term_fees_n'=>'15000','next_term_fees_s'=>'15000','next_term_fees_c'=>'15000'
   ];
   foreach($settings as $type=>$description) DB::table('settings')->insert(compact('type','description')+['created_at'=>$now,'updated_at'=>$now]);
   foreach(['super_admin','admin','teacher','parent','accountant','librarian','student'] as $i=>$type)
    DB::table('user_types')->insert(['title'=>ucwords(str_replace('_',' ',$type)),'name'=>$type,'level'=>strval($i+1),'created_at'=>$now,'updated_at'=>$now]);
   $classTypes=[];
   foreach(['PN'=>'Pre-Primary','P'=>'Primary','J'=>'Middle School','S'=>'Secondary'] as $code=>$name) {
    $classTypes[$code]=DB::table('class_types')->insertGetId(['code'=>$code,'name'=>$name,'created_at'=>$now,'updated_at'=>$now]);
   }
   $classes=[]; $sections=[];
   foreach(['Nursery','Junior KG','Senior KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'] as $name){
    $type=in_array($name,['Nursery','Junior KG','Senior KG'])?'PN':(in_array($name,['Class 9','Class 10'])?'S':(in_array($name,['Class 6','Class 7','Class 8'])?'J':'P'));
    $classes[$name]=DB::table('my_classes')->insertGetId(['name'=>$name,'class_type_id'=>$classTypes[$type],'created_at'=>$now,'updated_at'=>$now]);
    $sections[$name]=DB::table('sections')->insertGetId(['name'=>'A','my_class_id'=>$classes[$name],'active'=>1,'created_at'=>$now,'updated_at'=>$now]);
   }
   foreach(['A+','A-','B+','B-','AB+','AB-','O+','O-'] as $name)
    DB::table('blood_groups')->insert(['name'=>$name,'created_at'=>$now,'updated_at'=>$now]);
   DB::table('nationalities')->insert(['name'=>'Indian','created_at'=>$now,'updated_at'=>$now]);
   $state=DB::table('states')->insertGetId(['name'=>'Maharashtra','created_at'=>$now,'updated_at'=>$now]);
   DB::table('lgas')->insert(['name'=>'Pune','state_id'=>$state,'created_at'=>$now,'updated_at'=>$now]);
   foreach([['A',75,100,'Excellent'],['B',60,74,'Very Good'],['C',45,59,'Good'],['D',35,44,'Pass'],['F',0,34,'Needs Improvement']] as $g)
    DB::table('grades')->insert(['name'=>$g[0],'mark_from'=>$g[1],'mark_to'=>$g[2],'remark'=>$g[3],'created_at'=>$now,'updated_at'=>$now]);
   $makeUser=function($name,$username,$type,$password) use($now){
    return DB::table('users')->insertGetId(['name'=>$name,'username'=>$username,'email'=>$username.'@demo.invalid','user_type'=>$type,'code'=>strtoupper(Str::random(10)),'password'=>Hash::make($password),'created_at'=>$now,'updated_at'=>$now]);
   };
   $admin=$makeUser('Demo Principal','schooladmin','super_admin',$secret);
   $teacher=$makeUser('Demo Teacher','demoteacher','teacher',Str::random(48));
   $parent=$makeUser('Demo Parent','demoparent','parent',Str::random(48));
   $makeUser('Demo Accountant','demoaccountant','accountant',Str::random(48));
   foreach([['Demo Student A','DEMO-001','Class 8'],['Demo Student B','DEMO-002','Class 8'],['Demo Student C','DEMO-003','Class 7']] as $entry){
    $uid=$makeUser($entry[0],strtolower($entry[1]),'student',Str::random(48));
    DB::table('student_records')->insert(['user_id'=>$uid,'my_class_id'=>$classes[$entry[2]],'section_id'=>$sections[$entry[2]],'my_parent_id'=>$parent,'adm_no'=>$entry[1],'session'=>$session,'year_admitted'=>'2026','created_at'=>$now,'updated_at'=>$now]);
   }
   foreach(['English','Mathematics','Science','Social Studies'] as $name)
    DB::table('subjects')->insert(['name'=>$name,'slug'=>Str::slug($name),'my_class_id'=>$classes['Class 8'],'teacher_id'=>$teacher,'created_at'=>$now,'updated_at'=>$now]);
   DB::table('exams')->insert(['name'=>'First Term Demo Assessment','term'=>1,'year'=>$session,'created_at'=>$now,'updated_at'=>$now]);
  });
 }
}
