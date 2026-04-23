/**
 * app/lore/page.tsx
 * MCB Classified Files — full world lore in document format
 */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const TIMELINE = [
  { day: 'DAY 0',   label: 'THE IMPACT',           status: 'CONFIRMED', color: 'text-red-400',    border: 'border-red-400/30',
    text: 'The Moon departs its orbit at 03:17 UTC. Standard physics do not apply. Expected extinction-level impact does not occur. The Moon partially embeds into Earth\'s surface at coordinates ██████. The affected zone: radius approximately 400km.' },
  { day: 'DAY 3',   label: 'FIRST ANOMALIES',       status: 'CONFIRMED', color: 'text-orange-400', border: 'border-orange-400/30',
    text: 'Environmental readings within the impact zone show impossible data. Atmosphere composition altered. Gravitational anomalies detected. First human casualties reported — cause of death: ██████████████.' },
  { day: 'DAY 12',  label: 'INFECTION ZERO',        status: 'CONFIRMED', color: 'text-yellow-400', border: 'border-yellow-400/30',
    text: 'Patient Zero identified in settlement 14km from impact perimeter. Unknown pathogen. Does not match any known biological agent. Spreads through ██████ and possibly ██████. Mortality rate in early cases: 34%. Survivors exhibit ████████████ characteristics.' },
  { day: 'DAY 19',  label: 'CREATURE CONTACT',      status: 'CONFIRMED', color: 'text-purple-400', border: 'border-purple-400/30',
    text: 'First confirmed contact with unidentified lifeforms. Classification pending. Subjects appear to have emerged from the impact zone. Biological origin: UNKNOWN. Behavior: ████████████. Threat level: CRITICAL.' },
  { day: 'DAY 28',  label: 'UN EMERGENCY SESSION',  status: 'CONFIRMED', color: 'text-accent',     border: 'border-accent/30',
    text: 'All 193 UN member states vote unanimously to establish a unified global response force. The Moonfall Containment Bureau is formally created. Headquarters designated: classified. First Director appointed: ████████████.' },
  { day: 'DAY 40',  label: 'WALL CONSTRUCTED',      status: 'CONFIRMED', color: 'text-green-400',  border: 'border-green-400/30',
    text: 'The Containment Wall — 1,400km of reinforced barrier — is completed around the primary impact zone. Engineering feat accomplished in under 2 weeks through undisclosed means. The Wall holds. For now.' },
  { day: 'DAY 67',  label: 'ZONE CLASSIFICATION',   status: 'CONFIRMED', color: 'text-text',       border: 'border-border',
    text: 'The impact zone officially designated as Sector Omega. Entry forbidden without MCB clearance Level 3+. All pre-impact settlements within the zone declared ████████. Civilian evacuation completed — officially. Unofficial reports of ████████████ within the zone persist.' },
  { day: 'DAY ███', label: 'ONGOING OPERATIONS',    status: 'ACTIVE',    color: 'text-accent',     border: 'border-accent/30',
    text: 'MCB operations ongoing. Personnel losses: ██████. Current infection rate outside wall: classified. True nature of the Moonfall event: UNKNOWN. Bureau hypothesis document 7-C states: "The anomaly may have been ████████████ in origin. Further investigation is ██████████████."' },
];

const FILES = [
  {
    id: 'FILE-001',
    title: 'THE MOONFALL EVENT — ORIGIN ASSESSMENT',
    clearance: 'OMEGA',
    date: '████-██-██',
    content: `In the near future, a catastrophic anomaly occurs: the Moon descends from orbit and falls directly toward Earth.

Instead of causing total planetary destruction, the Moon partially embeds into the Earth's surface. The impact does not behave according to known physics — there is no global extinction, but the consequences are far worse in a different way.

From the impact site, unknown biological and environmental anomalies begin to spread. A mysterious disease emerges, infecting humans and altering living organisms. Alongside the infection, unnatural creatures begin to appear — their origins unclear, possibly linked to the Moon itself.

The affected zone becomes increasingly unstable, with reports of mutations, psychological effects, and unexplained phenomena.

Current assessment: the Moonfall event was NOT a natural astronomical occurrence. Working hypothesis ██████████████ remains classified pending further evidence.`,
  },
  {
    id: 'FILE-002',
    title: 'MCB MANDATE & OPERATIONAL SCOPE',
    clearance: 'DELTA',
    date: 'DAY 28',
    content: `The Moonfall Containment Bureau (MCB) is tasked with:

▸ Containing the Moon impact site and preventing zone expansion
▸ Halting the spread of the unknown pathogen
▸ Investigating the origin of the anomaly — classified priority
▸ Protecting what remains of human civilization

The MCB operates with full global authority, superseding all national governments within the containment perimeter and any zone designated as AFFECTED.

Personnel are recruited from all backgrounds: soldiers, researchers, medical teams, intelligence operatives, and specialists in fields that did not exist before Day 0.

Due to the extreme nature of the threat, the MCB conducts research operations that fall outside conventional ethical frameworks. This includes the use of ██████████████████ to better understand the disease and the Moon's influence. Personnel are briefed on the necessity of these measures upon reaching Clearance Level 4.`,
  },
  {
    id: 'FILE-003',
    title: 'PERSONNEL CLASSIFICATION SYSTEM',
    clearance: 'RESTRICTED',
    date: 'DAY 30',
    content: `All MCB personnel are treated as operational assets. Personal identity is subordinate to operational function.

DESIGNATION SYSTEM:
— Each operative is assigned a codename and a unique Bureau ID (MCB-XXXX)
— Codenames are permanent and non-transferable
— Personnel are assigned to squads based on specialization and threat assessment

STATUS CATEGORIES:
— ACTIVE: Fully operational. Cleared for deployment.
— INJURED: Medical hold. Limited operations only.
— MISSING: Unconfirmed location. Search & recovery authorized.
— DECEASED: Confirmed KIA or death by anomaly exposure.
— UNDER OBSERVATION: Suspected contamination or anomaly influence. Quarantine protocols in effect.

NOTE: Personnel under OBSERVATION status are to be treated as potential threats until cleared. All interactions must be logged and reported to Command.

The truth behind the Moonfall event remains unknown. Personnel are advised to limit speculation. Unauthorized dissemination of classified information is a violation of Directive 12-F and subject to immediate containment.`,
  },
];

export default function LorePage() {
  const [openFile, setOpenFile] = useState<string | null>('FILE-001');

  return (
    <Layout title="CLASSIFIED FILES" subtitle="// BUREAU ARCHIVE — CLEARANCE REQUIRED" classified maxWidth="lg">
      <div className="py-4 space-y-6">

        {/* Top warning */}
        <div className="border border-red-500/25 bg-red-500/5 p-3 font-mono text-[10px] text-red-400/70 leading-relaxed">
          WARNING: Unauthorized access to these files is a violation of Bureau Directive 12-F. All access attempts are logged and traced. You have been identified.
        </div>

        {/* Timeline */}
        <div className="panel p-5">
          <p className="mcb-section-header">INCIDENT TIMELINE — MOONFALL EVENT</p>
          <div className="space-y-3">
            {TIMELINE.map((e, i) => (
              <div key={i} className={`border-l-2 ${e.border} pl-4 py-1`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`font-mono text-[10px] font-bold ${e.color} tracking-widest w-20 flex-shrink-0`}>{e.day}</span>
                  <span className="font-mono text-[11px] text-text font-semibold tracking-wider uppercase">{e.label}</span>
                  <span className={`ml-auto font-mono text-[9px] tracking-widest ${e.status === 'ACTIVE' ? 'text-accent' : 'text-text-muted'}`}>[{e.status}]</span>
                </div>
                <p className="font-mono text-[10px] text-text-dim leading-relaxed pl-0">{e.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Document files */}
        <div className="space-y-3">
          <p className="mcb-section-header">BUREAU DOCUMENTS — RESTRICTED ARCHIVE</p>
          {FILES.map(file => (
            <div key={file.id} className="panel overflow-hidden">
              {/* File header */}
              <button
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/5 transition-colors"
                onClick={() => setOpenFile(openFile === file.id ? null : file.id)}
              >
                <span className="font-mono text-[10px] text-accent w-20 flex-shrink-0">{file.id}</span>
                <span className="font-mono text-[11px] text-text font-medium tracking-wider uppercase flex-1 text-left">{file.title}</span>
                <span className={`font-mono text-[9px] tracking-widest px-2 py-0.5 border ${
                  file.clearance === 'OMEGA'      ? 'border-red-500/40 text-red-400' :
                  file.clearance === 'DELTA'      ? 'border-accent/40 text-accent' :
                                                   'border-border text-text-muted'
                }`}>{file.clearance}</span>
                <span className="font-mono text-[10px] text-text-muted ml-2 font-mono">{openFile === file.id ? '▲' : '▼'}</span>
              </button>

              {/* File content */}
              {openFile === file.id && (
                <div className="border-t border-border p-5 bg-bg/30">
                  <div className="flex gap-4 mb-4 font-mono text-[9px] text-text-muted">
                    <span>DATE: {file.date}</span>
                    <span>CLASSIFICATION: {file.clearance}</span>
                    <span className="ml-auto">PAGE 1 OF 1</span>
                  </div>
                  <div className="space-y-3">
                    {file.content.split('\n\n').map((para, i) => (
                      <p key={i} className="font-mono text-[11px] text-text-dim leading-relaxed whitespace-pre-line">{para}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Redacted section */}
        <div className="panel p-5 space-y-3">
          <p className="mcb-section-header">DOCUMENT: HYPOTHESIS-7C // [REDACTED]</p>
          <div className="space-y-2">
            {[
              'The Moonfall was not a random event. Analysis of trajectory data suggests the Moon was',
              '████████████████████████████████████████████████████████████████████████████████████████',
              'leading some researchers to conclude that the impact was',
              '████████████████████████████████████████',
              'Furthermore, the biological agent spreading from the zone shows properties consistent with',
              '████████████████████████████████████████████████████████████████████████████████████████████████████████████████████',
              'The Bureau\'s working hypothesis — classified at OMEGA level — states that the Moon itself may be',
              '████████████████████████████████████████████████████████████████████████████',
              'This assessment, if accurate, changes everything about the MCB\'s mission.',
            ].map((line, i) => (
              <p key={i} className={`font-mono text-[11px] leading-relaxed ${line.includes('█') ? 'text-text-muted/40 select-none tracking-widest' : 'text-text-dim'}`}>{line}</p>
            ))}
          </div>
          <div className="border border-red-500/30 p-2 mt-3 flex items-center gap-2">
            <span className="classified-stamp text-[9px]">OMEGA CLEARANCE</span>
            <span className="font-mono text-[9px] text-red-400/60">REMAINDER OF DOCUMENT REQUIRES LEVEL 5 AUTHORIZATION</span>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
            <span className="font-mono text-[9px] text-text-muted tracking-widest">END OF PUBLIC ARCHIVE</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
          </div>
          <p className="font-mono text-[11px] text-text-dim text-center">
            You are applying to a classified global organization.<br />
            <span className="text-text">The Bureau does not forget. The Bureau does not forgive mistakes.</span>
          </p>
          <Link href="/apply" className="mcb-btn-primary w-full block text-center py-3 tracking-[0.3em]">
            ▶ PROCEED TO APPLICATION
          </Link>
          <Link href="/moonfall" className="mcb-btn-ghost w-full block text-center text-[10px]">
            VIEW INCIDENT VISUALIZATION
          </Link>
        </div>
      </div>
    </Layout>
  );
}
