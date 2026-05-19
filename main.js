<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>LINTECH | Recepční systém</title>
    <style>
        :root { --lintech-blue: #00205b; --lintech-red: #e30613; --lintech-gray: #f0f4f8; --lintech-text: #1a2b3c; }
        body { font-family: 'Segoe UI', Roboto, sans-serif; background: var(--lintech-gray); color: var(--lintech-text); margin: 0; padding: 0; overflow: hidden; user-select: none; }
        .header { background: #ffffff; color: var(--lintech-blue); padding: 15px 50px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 5px 15px rgba(0,32,91,0.1); border-bottom: 4px solid var(--lintech-blue); }
        .logo img { height: 60px; object-fit: contain; }
        .tablet-status { padding: 12px 25px; border-radius: 30px; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 15px; background: #eef2f5; border: 2px solid #ddd; }
        .status-dot { width: 14px; height: 14px; border-radius: 50%; background: #e74c3c; transition: 0.3s; }
        .status-online { background: #2ecc71; box-shadow: 0 0 12px #2ecc71; }
        .main-container { display: flex; justify-content: center; align-items: center; height: calc(100vh - 95px); padding: 20px; }
        .card { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.08); width: 100%; max-width: 1250px; min-height: 670px; display: none; flex-direction: column; }
        .card.active { display: flex; }
        h2 { color: var(--lintech-blue); font-size: 34px; border-bottom: 3px solid #eee; padding-bottom: 15px; text-transform: uppercase; }
        .grid-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-top: 40px; flex: 1;}
        .menu-btn { background: #fff; border: 4px solid var(--lintech-blue); border-radius: 15px; padding: 50px 25px; font-size: 26px; font-weight: 900; color: var(--lintech-blue); cursor: pointer; transition: 0.3s; text-transform: uppercase; }
        .menu-btn:hover { background: var(--lintech-blue); color: #fff; transform: translateY(-5px); }
        .menu-btn.red-zone { border-color: var(--lintech-red); color: var(--lintech-red); }
        .menu-btn.red-zone:hover { background: var(--lintech-red); color: #fff; }
        .input-group { margin-bottom: 20px; position: relative; }
        label { display: block; margin-bottom: 8px; font-weight: bold; font-size: 16px; color: #444; }
        input { width: 100%; padding: 18px; border: 3px solid #e1e8ed; border-radius: 10px; font-size: 18px; box-sizing: border-box; }
        .btn { padding: 18px 35px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 18px; }
        .btn-red { background: var(--lintech-red); color: white; }
        .btn-blue { background: var(--lintech-blue); color: white; }
        .btn-outline { background: transparent; border: 3px solid #ccc; color: #666; }
        .rules-split { display: flex; gap: 40px; flex: 1; margin-top: 10px; }
        .rules-left-col { flex: 1.1; background: #eef2f5; border-radius: 15px; padding: 25px; display: flex; flex-direction: column;}
        .rules-right-col { flex: 0.9; display: flex; flex-direction: column; align-items: center; border: 2px solid #e1e8ed; border-radius: 15px; padding: 25px; }
        #rules-content-container { flex: 1; overflow-y: auto; }
        canvas { background: #fff; border: 3px dashed #bdc3c7; border-radius: 10px; width: 100%; max-width: 500px; aspect-ratio: 500/220; }
        .suggestions-box { position: absolute; background: white; border: 2px solid #ddd; width: 100%; z-index: 100; box-shadow: 0 15px 30px rgba(0,0,0,0.15); border-radius: 0 0 10px 10px; display: none; max-height: 200px; overflow-y: auto; }
        .suggestion-item { padding: 18px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 18px; }
        .suggestion-item:hover { background: var(--lintech-blue); color: white; }
        .kiosk-alert-overlay { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 32, 91, 0.85); backdrop-filter: blur(4px); justify-content: center; align-items: center; z-index: 2000; }
        .kiosk-alert-box { background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 550px; }
        .rule-page { display: none; font-size: 18px; line-height: 1.5;}
        .rule-page.active { display: block; }
        .departure-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; overflow-y: auto; max-height: 420px; padding: 5px; }
        .visitor-row { background: #fff; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid var(--lintech-red); }
        .admin-nav { display: flex; gap: 15px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .admin-tab { padding: 12px 25px; font-size: 16px; font-weight: bold; cursor: pointer; background: #eee; border-radius: 8px; border: none; }
        .admin-tab.active { background: var(--lintech-blue); color: white; }
        .admin-section { display: none; }
        .admin-section.active { display: block; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 15px; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .data-table th { background: var(--lintech-blue); color: white; }
        .admin-sig-img { height: 45px; background: white; border: 1px solid #ccc; border-radius: 4px; padding: 2px; }
    </style>
</head>
<body>

<div class="header">
    <div class="logo"><img src="logo-lintech-dark.png" alt="LINTECH" onerror="this.outerHTML='<h1 style=\'margin:0; font-size:32px;\'>LINTECH</h1>'"></div>
    <div class="tablet-status"><div id="statusDot" class="status-dot"></div><span id="statusText">TABLET ODPOJEN</span></div>
</div>

<div class="main-container">
    <div id="screen-home" class="card active">
        <h2>Vítejte ve společnosti LINTECH</h2>
        <div class="grid-menu">
            <button class="menu-btn" onclick="switchView('register-form')">Jsem zde poprvé</button>
            <button class="menu-btn" onclick="switchView('search-registered')">Již jsem registrován</button>
        </div>
        <button class="menu-btn red-zone" style="margin-top:35px; width:100%; padding: 30px;" onclick="openDepartureView()">Odchod z budovy</button>
    </div>

    <div id="screen-register-form" class="card">
        <h2>Registrace nového profilu</h2>
        <div class="input-group"><label>Jméno a příjmení *</label><input type="text" id="reg-jmeno" autocomplete="off"><div id="reg-suggestions" class="suggestions-box"></div></div>
        <div class="input-group"><label>E-mail *</label><input type="email" id="reg-email" autocomplete="off"></div>
        <div class="input-group"><label>Telefon *</label><input type="text" id="reg-telefon" autocomplete="off"></div>
        <div class="input-group"><label>Společnost</label><input type="text" id="reg-spolecnost" autocomplete="off"></div>
        <div style="display:flex; justify-content: space-between; margin-top:auto;"><button class="btn btn-outline" onclick="switchView('home')">Zpět</button><button class="btn btn-blue" onclick="validateAndGoToRules()">Pokračovat ➔</button></div>
    </div>

    <div id="screen-rules" class="card" style="max-width:1300px;">
        <h2>Bezpečnostní předpisy</h2>
        <div class="rules-split">
            <div class="rules-left-col">
                <div id="rules-content-container"></div>
                <div class="rules-controls" style="margin-top:auto; padding-top:20px;"><button class="btn btn-outline" id="btn-prev-rule" onclick="prevRule()">Zpět</button><span id="rules-counter" style="font-weight:bold; font-size:20px;"></span><button class="btn btn-blue" id="btn-next-rule" onclick="nextRule()">Další</button></div>
            </div>
            <div class="rules-right-col" id="register-signature-area" style="display:none;">
                <label style="color:var(--lintech-red); font-weight:bold; margin-bottom:10px;">PODEPISUJTE ZDE:</label>
                <canvas id="canvasRegister" width="500" height="220"></canvas>
                <button class="btn btn-outline" onclick="clearCanvas()" style="margin-top:10px; width:100%;">Vymazat podpis</button>
                <button class="btn btn-red" id="submitRegBtn" style="margin-top:auto; width:100%;">Souhlasím a registrovat</button>
            </div>
        </div>
    </div>

    <div id="screen-search-registered" class="card">
        <h2>Rychlý vstup</h2>
        <div class="input-group" style="margin-top:40px;"><label>Jméno:</label><input type="text" id="search-input" autocomplete="off"><div id="search-suggestions" class="suggestions-box"></div></div>
        <div style="margin-top:auto;"><button class="btn btn-outline" onclick="switchView('home')">Zpět</button></div>
    </div>

    <div id="screen-arrival-confirm" class="card" style="max-width:1300px;">
        <h2>Potvrzení příchodu</h2>
        <div style="display:flex; gap:30px; flex:1;">
            <div style="flex:1.1; display:flex; flex-direction:column;">
                <div style="background: #eef2f5; padding:20px; border-radius:12px; margin-bottom:20px; border-left:6px solid var(--lintech-blue);">
                    <h3 id="arr-name" style="margin:0; font-size:26px; color:var(--lintech-blue);">---</h3>
                    <p id="arr-detail" style="margin:5px 0 0 0; font-size:18px; color:#555;">---</p>
                </div>
                <p style="font-weight:bold; font-size:16px;">✔ Potvrzuji, že znám bezpečnostní pravidla firmy LINTECH.</p>
                <div style="margin-top:20px; display:flex; flex-direction:column; align-items:center;">
                    <canvas id="canvasArrival" width="500" height="220"></canvas>
                    <button class="btn btn-outline" onclick="clearCanvas()" style="margin-top:10px; width:100%; max-width:500px;">Vymazat podpis</button>
                </div>
            </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
            <button class="btn btn-outline" onclick="switchView('search-registered')">Zrušit</button>
            <button class="btn btn-red" id="submitArrivalBtn">Potvrdit příchod</button>
        </div>
    </div>

    <div id="screen-departure" class="card">
        <h2>Odchod</h2>
        <div id="active-visitors-list" class="departure-grid"></div>
        <div style="margin-top:auto; padding-top:20px;"><button class="btn btn-outline" onclick="switchView('home')">Zpět</button></div>
    </div>

    <div id="screen-admin" class="card" style="max-width:1300px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
            <h2 style="margin:0; color:var(--lintech-red);">ADMINISTRACE SYSTÉMU</h2>
            <button class="btn btn-outline" onclick="switchView('home')">Odhlásit se</button>
        </div>
        <div class="admin-nav">
            <button class="admin-tab active" onclick="switchAdminTab('tab-budova')">Aktuálně uvnitř</button>
            <button class="admin-tab" onclick="switchAdminTab('tab-cleni')">Kompletní databáze</button>
            <button class="admin-tab" onclick="switchAdminTab('tab-pravidla')">Správa textů/slidů</button>
        </div>

        <div id="tab-budova" class="admin-section active" style="flex:1; overflow-y:auto;">
            <table class="data-table">
                <thead><tr><th>Jméno</th><th>Společnost</th><th>Telefon</th><th>Příchod</th><th>Akce</th></tr></thead>
                <tbody id="admin-table-budova"></tbody>
            </table>
        </div>

        <div id="tab-cleni" class="admin-section" style="flex:1; overflow-y:auto;">
            <table class="data-table">
                <thead><tr><th>ID</th><th>Jméno</th><th>E-mail</th><th>Společnost</th><th>Telefon</th><th>Reg. pod.</th><th>Vstup pod.</th></tr></thead>
                <tbody id="admin-table-cleni"></tbody>
            </table>
        </div>

        <div id="tab-pravidla" class="admin-section" style="flex:1; overflow-y:auto;">
            <textarea id="admin-pravidlo-text" style="width:100%; height:120px; padding:15px; font-size:16px; margin-bottom:10px;"></textarea>
            <button class="btn btn-blue" onclick="adminPridejPravidlo()">Přidat stranu</button>
            <button class="btn btn-red" onclick="adminSmazVsechnaPravidla()" style="float:right;">Smazat vše</button>
            <div id="admin-list-pravidel" style="margin-top:20px; background:#eee; padding:15px; border-radius:8px;"></div>
        </div>
    </div>
</div>

<div id="kioskAlert" class="kiosk-alert-overlay">
    <div class="kiosk-alert-box">
        <h3 id="alertTitle" style="margin-top:0; color:var(--lintech-blue);">Info</h3>
        <p id="alertMessage" style="font-size:20px; margin-bottom:30px;"></p>
        <button class="btn btn-blue" onclick="document.getElementById('kioskAlert').style.display='none';">Rozumím</button>
    </div>
</div>

<div id="departureModal" class="kiosk-alert-overlay">
    <div class="kiosk-alert-box" style="border-top: 8px solid var(--lintech-red);">
        <h3 style="margin-top:0; color:var(--lintech-blue);">Potvrzení odchodu</h3>
        <p id="departureModalMessage" style="font-size:20px; margin-bottom:30px;"></p>
        <input type="hidden" id="departureTargetId">
        <div style="display:flex; gap:15px; justify-content:center;">
            <button class="btn btn-outline" onclick="document.getElementById('departureModal').style.display = 'none';">Zrušit</button>
            <button class="btn btn-red" onclick="executeDeparture()">Potvrdit odchod</button>
        </div>
    </div>
</div>

<script>
    function showAlert(t, m) { document.getElementById('alertTitle').innerText=t; document.getElementById('alertMessage').innerText=m; document.getElementById('kioskAlert').style.display='flex'; }

    // WACOM DRIVER - OPRAVA PRO RASPBERRY PI
    var wacomstu430 = function(){
        this.config={vid:1386,pid:164}; this.device=null;
        this.connect=async function(){
            try{
                // Místo getDevices používáme requestDevice, které Electron potichu pustí dál!
                let devs = await navigator.hid.requestDevice({ filters: [{ vendorId: this.config.vid, productId: this.config.pid }] });
                if(devs && devs.length > 0) this.device = devs[0];
                if(this.device && !this.device.opened) await this.device.open();
                return !!this.device;
            }catch(e){ return false; }
        };
        this.clearScreen=async function(){ try{await this.device.sendFeatureReport(0x20,new Uint8Array([0]));}catch(e){} };
        this.onPenData=function(cb){
            if(!this.device) return;
            this.device.addEventListener("inputreport",e=>{
                if(e.reportId===0x01||e.reportId===0x34) cb({cx:e.data.getUint16(2),cy:e.data.getUint16(4),press:e.data.getUint16(0)/1023})
            });
        };
    };
    
    var wacom=new wacomstu430(); var canvas, context, hasDrawn=false, penDist=0, lastX, lastY;
    var vybranyNavstevnikId=null, nactenaPravidla=[], aktualniSlide=0;
    
    function resetAppState(){ hasDrawn=false; penDist=0; vybranyNavstevnikId=null; document.querySelectorAll('input').forEach(i=>i.value=''); if(canvas) context.clearRect(0,0,canvas.width,canvas.height); }
    function setTargetCanvas(cid){ canvas=document.getElementById(cid); context=canvas.getContext('2d'); context.lineWidth=4.5; context.lineCap='round'; hasDrawn=false; penDist=0; }
    function clearCanvas(){ if(context) context.clearRect(0,0,canvas.width,canvas.height); hasDrawn=false; penDist=0; if(wacom.device) wacom.clearScreen(); }

    async function initTablet(){
        let ok = await wacom.connect();
        document.getElementById('statusDot').className = ok ? 'status-dot status-online' : 'status-dot';
        document.getElementById('statusText').innerText = ok ? "TABLET PŘIPOJEN" : "TABLET ODPOJEN";
        if(ok){
            try{ await wacom.device.sendFeatureReport(0x0E,new Uint8Array([1])); await wacom.device.sendFeatureReport(0x21,new Uint8Array([1])); wacom.clearScreen(); }catch(e){}
            wacom.onPenData(d=>{
                if(!context || d.press<0.05) { lastX=null; lastY=null; return; }
                hasDrawn=true;
                let drawX = d.cx * (canvas.width/9600); let drawY = d.cy * (canvas.height/6000);
                if(lastX) penDist+=Math.hypot(drawX-lastX, drawY-lastY);
                if(!lastX) { context.beginPath(); context.moveTo(drawX, drawY); } else { context.lineTo(drawX, drawY); context.stroke(); }
                lastX=drawX; lastY=drawY;
            });
        }
    }
    
    navigator.hid.addEventListener('connect', initTablet);
    navigator.hid.addEventListener('disconnect', (e) => { if(e.device.vendorId===1386){ wacom.device=null; initTablet(); }});
    window.addEventListener('DOMContentLoaded', () => { initTablet(); switchView('home'); });

    // JEDNODUCHÁ VALIDACE PODPISU
    function isSignatureValid(){ return hasDrawn && penDist > 200; }

    function switchView(id){ 
        if(id==='home') resetAppState();
        document.querySelectorAll('.card').forEach(c=>c.style.display='none'); 
        document.getElementById('screen-'+id).style.display='flex';
        if(id==='rules'){ setTargetCanvas('canvasRegister'); if(wacom.device) wacom.clearScreen(); }
        if(id==='arrival-confirm'){ setTargetCanvas('canvasArrival'); if(wacom.device) wacom.clearScreen(); }
        if(id==='admin') loadAdminData();
    }

    // AUTOCOMPLETE
    function setupAutocomplete(inId, sugId, cb){
        const inp=document.getElementById(inId); const sug=document.getElementById(sugId);
        inp.addEventListener('input', async(e)=>{
            if(e.target.value.length<2){sug.style.display='none';return;}
            const res=await window.api.hledejOsobu(e.target.value);
            if(res.length>0){
                sug.innerHTML=''; res.forEach(o=>{
                    let div=document.createElement('div'); div.className='suggestion-item'; div.innerText=`${o.jmeno} (${o.spolecnost||'Člen'})`;
                    div.onclick=()=>{ cb(o); sug.style.display='none'; }; sug.appendChild(div);
                }); sug.style.display='block';
            } else sug.style.display='none';
        });
        document.addEventListener('click', (e)=>{ if(e.target!==inp) sug.style.display='none'; });
    }

    setupAutocomplete('reg-jmeno', 'reg-suggestions', o=>{ vybranyNavstevnikId=o.id; document.getElementById('arr-name').innerText=o.jmeno; document.getElementById('arr-detail').innerText=o.spolecnost||o.email; setTimeout(()=>switchView('arrival-confirm'), 1000); });
    setupAutocomplete('search-input', 'search-suggestions', o=>{
        if(o.posledni_stavy==='Uvnitr'){ showAlert("Chyba", "Uživatel je již uvnitř budovy."); switchView('home'); }
        else { vybranyNavstevnikId=o.id; document.getElementById('arr-name').innerText=o.jmeno; document.getElementById('arr-detail').innerText=o.spolecnost||o.email; switchView('arrival-confirm'); }
    });

    // PRAVIDLA
    async function validateAndGoToRules(){
        const j=document.getElementById('reg-jmeno').value, e=document.getElementById('reg-email').value, t=document.getElementById('reg-telefon').value;
        if(j==='root' && e==='root@lintech.cz') { switchView('admin'); return; }
        if(!j||!e||!t){ showAlert("Chyba", "Jméno, E-mail a Telefon jsou povinné!"); return; }
        nactenaPravidla = await window.api.nactiPravidla();
        if(nactenaPravidla.length===0) nactenaPravidla=[{obsah:"<h2>Bezpečnost</h2><p>Dodržujte pokyny.</p>"}];
        aktualniSlide=0; const c=document.getElementById('rules-content-container'); c.innerHTML='';
        nactenaPravidla.forEach((p,i)=>{ let d=document.createElement('div'); d.className='rule-page'+(i===0?' active':''); d.id='slide-'+i; d.innerHTML=p.obsah; c.appendChild(d); });
        updateRulesUI(); switchView('rules');
    }

    function prevRule(){ if(aktualniSlide>0){ aktualniSlide--; updateRulesUI(); } }
    function nextRule(){ if(aktualniSlide<nactenaPravidla.length-1){ aktualniSlide++; updateRulesUI(); } }
    function updateRulesUI(){
        document.querySelectorAll('.rule-page').forEach(e=>e.classList.remove('active')); document.getElementById('slide-'+aktualniSlide).classList.add('active');
        document.getElementById('rules-counter').innerText = `${aktualniSlide+1} / ${nactenaPravidla.length}`;
        let isLast = aktualniSlide === nactenaPravidla.length-1;
        document.getElementById('btn-next-rule').style.visibility = isLast ? 'hidden' : 'visible';
        document.getElementById('register-signature-area').style.display = isLast ? 'flex' : 'none';
    }

    // ODESLÁNÍ
    document.getElementById('submitRegBtn').onclick = async()=>{
        if(!wacom.device){ showAlert("Chyba", "Tablet není připojen."); return; }
        if(!isSignatureValid()){ showAlert("Chyba", "Podpis je prázdný nebo příliš krátký."); return; }
        const d = { jmeno:document.getElementById('reg-jmeno').value, email:document.getElementById('reg-email').value, telefon:document.getElementById('reg-telefon').value, spolecnost:document.getElementById('reg-spolecnost').value, podpis:canvas.toDataURL("image/png") };
        const res = await window.api.ulozNavstevnika(d);
        if(res.success){ vybranyNavstevnikId=res.id; document.getElementById('arr-name').innerText=d.jmeno; document.getElementById('arr-detail').innerText=d.spolecnost||d.email; switchView('arrival-confirm'); }
    };

    document.getElementById('submitArrivalBtn').onclick = async()=>{
        if(!wacom.device){ showAlert("Chyba", "Tablet není připojen."); return; }
        if(!isSignatureValid()){ showAlert("Chyba", "Podpis je prázdný nebo příliš krátký."); return; }
        const res = await window.api.zaznamenejPrichod({ navstevnikId: vybranyNavstevnikId, podpisVstup: canvas.toDataURL("image/png") });
        if(res.success){ showAlert("Vítejte", "Váš příchod byl zaznamenán."); switchView('home'); }
    };

    // ODCHODY
    async function openDepartureView(){
        switchView('departure'); const l=document.getElementById('active-visitors-list'); l.innerHTML='Načítám...';
        const v = await window.api.nactiAktivni(); l.innerHTML='';
        if(v.length===0){ l.innerHTML='<p>Nikdo není uvnitř.</p>'; return; }
        v.forEach(x=>{
            let d=document.createElement('div'); d.className='visitor-row';
            d.innerHTML=`<div><h4 style="margin:0;">${x.jmeno}</h4><p style="margin:0;">Příchod: ${x.cas}</p></div><button class="btn btn-outline" style="color:var(--lintech-red); border-color:var(--lintech-red);" onclick="openDepartureModal(${x.dochazka_id},'${x.jmeno}')">Odchod</button>`;
            l.appendChild(d);
        });
    }

    function openDepartureModal(id, j){ document.getElementById('departureTargetId').value=id; document.getElementById('departureModalMessage').innerText=`Odhlásit uživatele ${j}?`; document.getElementById('departureModal').style.display='flex'; }
    async function executeDeparture(){
        let id=document.getElementById('departureTargetId').value; document.getElementById('departureModal').style.display='none';
        let res=await window.api.zaznamenejOdchod(id); if(res.success){ showAlert("Odhlášeno", "Návštěva byla ukončena."); switchView('home'); }
    }

    // ADMIN
    function switchAdminTab(t){ document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active')); document.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('active')); document.getElementById(t).classList.add('active'); event.currentTarget.classList.add('active'); }
    async function loadAdminData(){
        const b=await window.api.nactiAktivni(), tb=document.getElementById('admin-table-budova'); tb.innerHTML='';
        b.forEach(x=>tb.innerHTML+=`<tr><td>${x.jmeno}</td><td>${x.spolecnost}</td><td>${x.telefon}</td><td>${x.cas}</td><td><button onclick="window.api.zaznamenejOdchod(${x.dochazka_id}).then(()=>loadAdminData())">Odešel</button></td></tr>`);
        const c=await window.api.nactiVsechnyCleny(), tc=document.getElementById('admin-table-cleni'); tc.innerHTML='';
        c.forEach(x=>tc.innerHTML+=`<tr><td>${x.id}</td><td>${x.jmeno}</td><td>${x.email}</td><td>${x.spolecnost}</td><td>${x.telefon}</td><td><img src="${x.podpis_base64}" class="admin-sig-img"></td><td>${x.posledni_podpis?`<img src="${x.posledni_podpis}" class="admin-sig-img">`:'-'}</td></tr>`);
        const p=await window.api.nactiPravidla(), tp=document.getElementById('admin-list-pravidel'); tp.innerHTML='';
        p.forEach(x=>tp.innerHTML+=`<div style="background:#fff; padding:10px; margin-bottom:5px;"><b>Strana ${x.poradi}:</b> ${x.obsah.substring(0,50)}...</div>`);
    }
    async function adminPridejPravidlo(){ let t=document.getElementById('admin-pravidlo-text').value; if(!t)return; let p=await window.api.nactiPravidla(); await window.api.ulozPravidlo(t,p.length+1); document.getElementById('admin-pravidlo-text').value=''; loadAdminData(); }
    async function adminSmazVsechnaPravidla(){ if(confirm("Smazat vše?")){ await window.api.smazPravidla(); loadAdminData(); } }
</script>

</body>
</html>
