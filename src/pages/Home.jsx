import React from 'react';
import { Link } from 'react-router-dom';

export default function Home(){
  return (
    <div className="tiles-wrap">
      {/* Colonne gauche */}
      <div className="section-card">
        <div className="section-title strong-title">Simulateurs épargne retraite</div>
        <Tile to="/sim/potentiel" icon={<IconGauge/>} title="Epargne retraite, contrôle du potentiel" />
        <Tile to="/sim/transfert" icon={<IconTarget/>} title="PER, transfert d'un dispositif" />
        <Tile to="/sim/strategie-is" icon={<IconHome/>} title={<><span>SERenity</span><span className="tile-note">, (réorientation de la capacité d'épargne)</span></>} />
      </div>

      {/* Colonne droite */}
      <div className="section-card">
        <div className="section-title normal-title">Simulateurs rapides</div>
        <Tile to="/sim/ir" icon={<IconCalc/>} title="Impôt sur le revenu" />
        <Tile to="/sim/placement" icon={<IconChart/>} title="Placement" />
        <Tile to="/sim/credit" icon={<IconPercent />} title="Crédit" />
      </div>
    </div>
  );
}

function Tile({to, icon, title}){
  return (
    <Link to={to} className="tile">
      <div className="tile-row">
        <div className="tile-icon">{icon}</div>
        <div className="tile-sep" />
        <div className="tile-title">{title}</div>
      </div>
    </Link>
  );
}

function IconGauge(){ return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><path d="M12 13l3-3" /><path d="M20 14A8 8 0 1 0 4 14" /><path d="M6 14h.01M10 14h.01M14 14h.01M18 14h.01"/></svg>)}
function IconTarget(){ return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><path d="M12 7v10M7 12h10"/><circle cx="12" cy="12" r="8"/></svg>)}
function IconPercent() { return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><line x1="8" y1="16" x2="16" y2="8" /></svg>);}
function IconCalc(){ return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h8"/></svg>)}
function IconChart(){ return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><path d="M3 20h18"/><path d="M7 16l3-3 3 2 5-6"/></svg>)}
function IconHome(){ return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>)}
