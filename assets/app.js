const N=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const lanes=['Baron','Jungle','Mid','ADC','Support'],keys=['top','jungle','mid','adc','support'];
const roles={tank:['tank'],fighter:['fighter'],mage:['mage'],assassin:['assassin'],marksman:['marksman'],support:['support']};
const patterns={
range:['Caitlyn','Ezreal','Ashe','Varus','Lux','Ziggs','Jayce','Teemo','Vayne','Senna','Zeri'],
poke:['Caitlyn','Ezreal','Ziggs','Lux','Karma','Varus','Jayce','Zyra','Brand','Xerath','Ashe'],
engage:['Leona','Nautilus','Alistar','Rakan','Blitzcrank','Thresh','Amumu','Malphite','Jarvan IV','Vi','Pantheon','Galio'],
peel:['Janna','Lulu','Braum','Morgana','Nami','Renata Glasc','Thresh','Tahm Kench'],
sustain:['Soraka','Sona','Nami','Yuumi','Milio','Vladimir','Nasus','Dr. Mundo','Garen'],
mobility:['Ezreal','Lucian','Vayne','KaiSa','Tristana','Xayah','Zeri','Ahri','Akali','Fizz','Zed','Katarina','Riven','Fiora','Camille','Lee Sin'],
tank:['Malphite','Ornn','Sion','Braum','Leona','Nautilus','Alistar','Rammus','Amumu','Dr. Mundo','Shen','Galio','Thresh'],
magic:['Ahri','Akali','Annie','Aurelion Sol','Brand','Diana','Ekko','Evelynn','Fizz','Galio','Karma','Kassadin','Katarina','Kennen','Lillia','Lux','Morgana','Orianna','Seraphine','Syndra','Veigar','Vladimir','Ziggs','Zoe','Zyra','Swain','Teemo'],
control:['Ashe','Annie','Lissandra','Malphite','Leona','Nautilus','Alistar','Braum','Amumu','Morgana','Lux','Galio','Thresh','Rakan','Varus','Zyra','Veigar','Janna','Nami'],
duelist:['Fiora','Jax','Darius','Renekton','Riven','Camille','Olaf','Warwick','Xin Zhao','Lee Sin','Viego','Irelia'],
scale:['Kayle','Vayne','Jinx','Kassadin','Nasus','Veigar','Sivir','Senna','Twitch','Zeri','Master Yi'],
early:['Draven','Lucian','Caitlyn','Renekton','Darius','Lee Sin','Pantheon','Kalista','Xin Zhao','Jarvan IV'],
invade:['Lee Sin','Graves','Olaf','Xin Zhao','KhaZix','Kindred','Warwick','Nidalee']
};
const special={
'Yasuo':['Renekton','Annie','Malphite','Pantheon','Vex'],
'Zed':['Lissandra','Malphite','Galio','Annie'],
'Fizz':['Galio','Lissandra','Kassadin'],
'Katarina':['Galio','Annie','Pantheon','Diana'],
'Akali':['Galio','Pantheon','Annie'],
'Ahri':['Kassadin','Galio','Diana'],
'Jinx':['Caitlyn','Draven','Tristana','Lucian'],
'Caitlyn':['Ezreal','Sivir','Varus'],
'Draven':['Ashe','Caitlyn','Ezreal'],
'Ezreal':['Caitlyn','Vayne','Jinx'],
'Nautilus':['Morgana','Braum','Janna','Ezreal','Xayah'],
'Leona':['Morgana','Janna','Braum','Alistar'],
'Blitzcrank':['Morgana','Ezreal','Sivir'],
'Yuumi':['Leona','Nautilus','Blitzcrank','Thresh'],
'Lulu':['Zyra','Brand','Pyke'],
'Soraka':['Blitzcrank','Pyke','Leona'],
'Darius':['Fiora','Vayne','Teemo','Kennen'],
'Garen':['Vayne','Fiora','Camille'],
'Teemo':['Malphite','Olaf','Pantheon'],
'Nasus':['Darius','Renekton','Vayne'],
'Fiora':['Malphite','Kennen','Teemo'],
'Malphite':['Gwen','Mordekaiser','Sylas'],
'Master Yi':['Rammus','Amumu','Vi','Warwick'],
'Lee Sin':['Rammus','Warwick','Vi'],
'KhaZix':['Rammus','Warwick','Vi'],
'Evelynn':['Rengar','Lee Sin','Warwick']
};
let champions=[],stats={},meta={},lane=2,values={allyAdc:null,allySup:null,enemy:null,enemyAdc:null,enemySup:null},filter='all',favs=[],history=[],slot=null;
const $=id=>document.getElementById(id);
const safeRead=(key,otherwise)=>{try{return JSON.parse(localStorage.getItem(key))??otherwise}catch{return otherwise}};
const save=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
favs=safeRead('wrc_favs',[]);history=safeRead('wrc_history',[]);
const find=id=>champions.find(c=>N(c.id)===N(id)||N(c.name)===N(id));
const has=(c,k)=>!!c&&patterns[k]?.some(x=>N(x)===N(c.name));
const image=c=>'https://cdn.communitydragon.org/latest/champion/'+encodeURIComponent(c.id)+'/square';
function eligible(c){return c.lanes?.includes(keys[lane])}
function occupied(c){return Object.values(values).some(x=>x&&N(x)===N(c.id))}
function currentStats(c){let all=stats?.data?.all?.[keys[lane]]||[];let entry=all.find(x=>N(x.id)===N(c.id));let wr=Number(entry?.win_rate_percent);return wr>25&&wr<75?{wr,source:'Regional ranked lane win rate'}:null}
function profile(c){return {ranged:has(c,'range'),poke:has(c,'poke'),engage:has(c,'engage'),peel:has(c,'peel'),sustain:has(c,'sustain'),mobile:has(c,'mobility'),tank:has(c,'tank'),magic:has(c,'magic'),control:has(c,'control'),duelist:has(c,'duelist'),early:has(c,'early'),scale:has(c,'scale'),invade:has(c,'invade')}}
function assess(c){let opp=lane<3?[find(values.enemy)]:[find(values.enemyAdc),find(values.enemySup)],friend=lane===3?find(values.allySup):lane===4?find(values.allyAdc):null;
let pc=profile(c),pf=profile(friend),points=50,reasons=[],matches=0;const add=(n,msg)=>{points+=n;if(msg&&!reasons.includes(msg))reasons.push(msg)};
for(let o of opp.filter(Boolean)){let po=profile(o);
if(special[o.name]?.some(x=>N(x)===N(c.name))){add(13,'Favorable matchup archetype against '+o.name);matches++}
if(po.engage&&pc.peel)add(7,'Can disrupt enemy engage');
if(po.engage&&pc.mobile)add(5,'Mobility helps avoid engages');
if(po.tank&&pc.magic)add(3,'Mixed damage pressure against frontline');
if(po.poke&&pc.sustain)add(6,'Sustain can withstand poke');
if(po.mobile&&pc.control)add(6,'Control helps punish mobility');
if(po.early&&pc.ranged)add(3,'Range may manage early trades');
if(lane===1&&po.invade&&pc.duelist)add(5,'Strong dueling against jungle pressure');
if(lane===1&&po.scale&&pc.early)add(5,'Early tempo against scaling jungle');
if(lane!==1&&po.duelist&&pc.ranged)add(5,'Range helps manage melee trading');
}
if(friend){if(pf.engage&&pc.early)add(8,'Strong all-in synergy with your duo');
if(pf.poke&&pc.poke)add(7,'Double-poke lane pressure');
if(pf.peel&&pc.scale)add(7,'Peel protects your scaling pick');
if(pf.sustain&&pc.early)add(4,'Sustain enables extended trades');
if(pf.control&&pc.poke)add(4,'Can follow up on partner crowd control');
if(pf.engage&&pc.control)add(5,'Crowd-control chain potential')}
if(filter==='safe'&&(pc.mobile||pc.peel||pc.sustain||pc.tank))add(8,'Defensive toolkit');
if(filter==='aggressive'&&(pc.early||pc.engage||pc.duelist))add(8,'Aggressive lane pressure');
if(filter==='scaling'&&pc.scale)add(10,'Strong late-game scaling');
if(filter==='easy'&&Number(c.difficult)<=1)add(8,'Accessible mechanics');
let s=currentStats(c);if(s){points+=Math.max(-8,Math.min(8,(s.wr-50)*1.4));reasons.push('Lane win rate '+s.wr.toFixed(1)+'% (regional)')}
if(!reasons.length)reasons.push('Available pick in this role; limited matchup evidence');
return{c,score:Math.round(Math.min(95,Math.max(20,points))),reasons:reasons.slice(0,3),s,matches};
}
function canShow(){return lane<3?!!values.enemy:!!values.enemyAdc&&!!values.enemySup&&!!(lane===3&&!values.allySup)&&!!(lane===4&&!values.allyAdc)}
function render(){ $('roles').innerHTML=lanes.map((n,i)=>'<button class="role '+(i===lane?'active':'')+'" onclick="setLane('+i+')"><span>'+['♜','⚔','✧','➶','✦'][i]+'</span>'+n+'</button>').join('');
let inputs=lane<3?[['enemy','ENEMY '+lanes[lane].toUpperCase()]]:lane===3?[['allySup','YOUR SUPPORT'],['enemyAdc','ENEMY ADC'],['enemySup','ENEMY SUPPORT']]:[['allyAdc','YOUR ADC'],['enemyAdc','ENEMY ADC'],['enemySup','ENEMY SUPPORT']];
$('fields').innerHTML=inputs.map(([id,title])=>{let c=find(values[id]);return'<div class="field"><label>'+title+'</label><button class="choose" onclick="openPicker(\''+id+'\')">'+(c?'<img src="'+image(c)+'" onerror="this.style.opacity=0">':'<span style="font-size:35px;color:#7eb5b2">＋</span>')+'<span><strong>'+(c?.name||'Select champion')+'</strong><small>'+(c?'Tap to change':'Choose from available champions')+'</small></span></button></div>'}).join('');
$('filter').innerHTML=[['all','All picks'],['easy','Easy'],['safe','Safe'],['aggressive','Aggressive'],['scaling','Late game']].map(([k,n])=>'<button class="filter '+(filter===k?'active':'')+'" onclick="setFilter(\''+k+'\')">'+n+'</button>').join('');
let valid=canShow();$('empty').classList.toggle('hidden',valid);$('output').classList.toggle('hidden',!valid);
if(valid){let results=champions.filter(eligible).filter(c=>!occupied(c)).map(assess).sort((a,b)=>b.score-a.score||a.c.name.localeCompare(b.c.name)).slice(0,8);
$('results').innerHTML=results.map((r,i)=>'<article class="result"><img class="portrait" src="'+image(r.c)+'" loading="lazy" onerror="this.style.opacity=.15"><div><span class="rank">#'+(i+1)+' · '+(r.score>=67?'HIGH FIT':r.score>=56?'GOOD FIT':'CONDITIONAL')+'</span><h3>'+r.c.name+'</h3><p>'+r.reasons.join(' · ')+'</p><span class="small">'+(r.s?'Observed lane win rate: '+r.s.wr.toFixed(1)+'%':'No verified lane win rate available')+' · Difficulty '+(r.c.difficult||'?')+'/3</span></div><div><div class="score">'+r.score+'<small>FIT SCORE*</small></div><button class="star '+(favs.includes(r.c.id)?'fav':'')+'" onclick="toggleFav(\''+r.c.id+'\')">'+(favs.includes(r.c.id)?'★':'☆')+'</button></div></article>').join('')||'<p>No eligible champions in the currently loaded catalog.</p>';
$('quality').textContent='*Fit score is an explainable heuristic, NOT a head-to-head win probability. '+(results.some(x=>x.s)?'Regional ranked lane win rates are included where available.':'No matching lane statistics available.');
}
$('history').innerHTML=history.map((h,i)=>'<button onclick="restore('+i+')">'+h.title+'</button>').join('')||'<span class="small">No recent matchups yet</span>';
$('favorites').textContent='★ '+favs.length+' favorites';$('source').textContent='Champion catalog: community data · Ranked lane statistics: '+(stats?.date?new Date(stats.date).toLocaleDateString():'unavailable')+' · Last sync: '+(meta?.updated_at?new Date(meta.updated_at).toLocaleDateString():'unknown')+'. Matchup fit is an independently authored archetype heuristic, not observed matchup win rates.';
}
function setLane(i){lane=i;filter='all';render()}function setFilter(v){filter=v;render()}function clearAll(){values={allyAdc:null,allySup:null,enemy:null,enemyAdc:null,enemySup:null};render()}
function toggleFav(id){favs=favs.includes(id)?favs.filter(v=>v!==id):[...favs,id];save('wrc_favs',favs);render()}
function storeMatch(){if(!canShow())return;let title=lane<3?lanes[lane]+' vs '+find(values.enemy)?.name:lanes[lane]+' vs '+find(values.enemyAdc)?.name+' + '+find(values.enemySup)?.name;history=[{lane,values:{...values},title},...history.filter(h=>h.title!==title)].slice(0,8);save('wrc_history',history);render()}
function restore(i){let h=history[i];lane=h.lane;values={...h.values};render()}
function openPicker(id){slot=id;$('modal').classList.add('open');$('search').value='';$('pickerTitle').textContent='SELECT '+(id.startsWith('enemy')?'ENEMY':'ALLY')+' CHAMPION';drawPicker();$('search').focus()}
function closePicker(){$('modal').classList.remove('open')}
function choose(id){values[slot]=id;closePicker();storeMatch();render()}
function clearSlot(){values[slot]=null;closePicker();render()}
function drawPicker(){let q=N($('search').value),role=slot==='allyAdc'||slot==='enemyAdc'?'adc':slot==='allySup'||slot==='enemySup'?'support':keys[lane];let sorted=champions.filter(c=>c.lanes.includes(role)&&N(c.name).includes(q)).sort((a,b)=>a.name.localeCompare(b.name));$('pickerGrid').innerHTML=sorted.map(c=>'<button class="pick" onclick="choose(\''+c.id+'\')"><img src="'+image(c)+'" loading="lazy" onerror="this.style.opacity=.1">'+c.name+'</button>').join('')||'<p>No champions found.</p>'}
async function start(){try{let a=await fetch('./data/champions.json?'+Date.now());if(a.ok){let list=await a.json();champions=list.filter(c=>c.is_wr!==false&&Array.isArray(c.lanes)).map(c=>({...c,lanes:c.lanes.map(x=>({baron:'top',dragon:'adc',bottom:'adc',bot:'adc'}[x]||x))}));}}catch(e){console.warn(e)}try{let r=await fetch('./data/stats.json?'+Date.now());if(r.ok)stats=await r.json()}catch(e){}try{let r=await fetch('./data/status.json?'+Date.now());if(r.ok)meta=await r.json()}catch(e){}$('count').textContent=champions.length+' CHAMPIONS';render()}
start();