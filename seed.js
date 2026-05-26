// ============================================================
// SEED DATA — Arbeidsgivertjenester CRM
// All datoer er ISO (YYYY-MM-DD). Dagens dato = 2026-05-21.
// ============================================================

const SEED = (() => {

  const pakker = [
    {
      id: 'p1',
      navn: 'Omstillingsprosess',
      type: 'omstilling',
      beskrivelse: 'Strukturert 6-trinns omstillingsforløp med personprofil, CV-arbeid og intervjutrening.',
      målgruppe: 'Arbeidstakere i omstilling',
      innledning: 'Vi tilbyr en helhetlig omstillingsprosess som tar arbeidstaker gjennom kartlegging, bevisstgjøring av kompetanse og motivasjon, markedsrettet CV/søknad og intervjutrening. Programmet er bygget rundt seks veiledningsmøter med dokumentert for- og etterarbeid.',
      møter: [
        { id: 'm1', fase: 'Oppstart', møtenr: 1, forarbeidT: 1, møteT: 1.5, etterarbeidT: 0,
          innhold: 'Oppstart — "bli kjent"-møte\nGjennomgang av situasjonen\nGjennomgang av CV (CV eller arbeidserfaring og oppgaver i nåværende jobb sendes i forkant)\nKonkrete behov som skal dekkes og eventuell tilpasning av programmet',
          hjemmeoppgave: 'Narrativ' },
        { id: 'm2', fase: 'Kartlegging — bevisstgjøring av kompetanse, motivasjon og personlige egenskaper', møtenr: 2, forarbeidT: 0, møteT: 2, etterarbeidT: 0,
          innhold: 'Bevisstgjøring av motivasjon, kompetanse og personlige egenskaper gjennom narrativ metodikk; herunder gjennomgang av personlige egenskaper\nInformasjon om Inflow24',
          hjemmeoppgave: 'Gjennomføre profilering i Inflow24' },
        { id: 'm3', fase: 'Personprofilanalyse og verktøy', møtenr: 3, forarbeidT: 0, møteT: 3, etterarbeidT: 0,
          innhold: 'Kartlegging/tilbakelesning inkl. lisens, samt for- og etterarbeid\nGjennomgang av personprofil — Inflow24\nBevisstgjøring av karrieremuligheter og -ønsker\nInteresser, preferanser, personlighet, trivselselementer og energilekkasjer\nBruk av SØT-modell for å identifisere nåværende situasjon, ønsket situasjon og eventuelle tiltak\nStillinger/stillingstyper og jobbinnhold\nBransjer og/eller bedrifter',
          hjemmeoppgave: 'Finne frem dokumentasjon (attester, vitnemål og CV hvis ikke klar)' },
        { id: 'm4', fase: 'CV/søknad', møtenr: 4, forarbeidT: 0, møteT: 3, etterarbeidT: 0,
          innhold: 'CV/Jobbsøk\nEtablere master-CV\nSøknadsbrevet — lage førsteutkast\nBevisstgjøring av nettverk',
          hjemmeoppgave: 'Finne relevant utlyst stilling' },
        { id: 'm5', fase: 'Markedsrettet CV/søknad og bruk av KI', møtenr: 5, forarbeidT: 0, møteT: 1.5, etterarbeidT: 0,
          innhold: 'Spissing mot relevante stillinger\nStillinger og stillingstyper\nSpisse CV og søknadsbrev mot stilling\nEffektiv og kritisk bruk av KI i prosessen',
          hjemmeoppgave: '' },
        { id: 'm6', fase: 'Sluttprosess — intervjutrening og veien videre', møtenr: 6, forarbeidT: 0, møteT: 2.5, etterarbeidT: 0,
          innhold: 'Intervjutrening — gjennomføring og tilbakemelding\nAktiviteter fremover (hva/når)\nEvaluering',
          hjemmeoppgave: '' },
      ],
      tillegg: [
        { id: 'a1', navn: 'Lisens Profilering InFlow24', pris: 400 },
      ],
      timepris: 1650,
      pris: 22500,
      mvaFritak: false,
      bruker_standardvilkår: true,
      betalingsbetingelser: 'Faktureres etterskuddsvis per måned. Forfall 14 kalenderdager.',
    },
    {
      id: 'p2',
      navn: 'Ekspertbistand',
      type: 'sykefravær',
      beskrivelse: 'Sykefraværsoppfølging gjennom NAVs Ekspertbistand — 4 faser med kartlegging, veiledning og arbeidsrådgivning.',
      målgruppe: 'Sykmeldte arbeidstakere og deres arbeidsgivere',
      innledning: 'Vi tilbyr sykefraværsoppfølging gjennom NAVs Ekspertbistand. Tjenesten gjennomføres i fire faser og kombinerer individuell veiledning med kartlegging, karriereveiledning gjennom Inflow24 og strukturert arbeidsrådgivning. Leveransen avsluttes med felles statusmøte og skriftlig rapport.',
      møter: [
        { id: 'm1', fase: 'Oppstart', møtenr: 1, forarbeidT: 1, møteT: 1.5, etterarbeidT: 0,
          innhold: 'Forberedelse til oppstart, dokumenter mm.\nFelles oppstartsmøte på arbeidsplass (inkl. reisevei til og fra)\nTelefonsamtale og sms-korrespondanse med arbeidstaker',
          hjemmeoppgave: '' },
        { id: 'm2', fase: 'Kartlegging', møtenr: 2, forarbeidT: 1, møteT: 4, etterarbeidT: 1,
          innhold: 'Individuell veiledning i samtaler\nGjennomgang av kartleggingsskjema\nKarriereveiledning med Inflow24\nKartlegging av arbeidsoppgaver, miljø og friskfaktorer\nSms, telefonsamtaler og e-post med arbeidstaker',
          hjemmeoppgave: 'Gjennomføre profilering i Inflow24' },
        { id: 'm3', fase: 'Arbeidsrådgivning og muligheter', møtenr: 3, forarbeidT: 1, møteT: 3, etterarbeidT: 1,
          innhold: 'Veiledningssamtaler med arbeidstaker om muligheter og tilrettelegging på egen arbeidsplass\nVidere arbeid med Inflow24 — identifisering av flyt og energilekkasjer, tiltak\nMail- og sms-dialog med arbeidstaker\nStillingsanalyse og drøfting av stillinger',
          hjemmeoppgave: '' },
        { id: 'm4', fase: 'Oppsummering og veien videre', møtenr: 4, forarbeidT: 0.5, møteT: 2.5, etterarbeidT: 1.5,
          innhold: 'Statusmøte\nFelles møte med arbeidstaker, arbeidsgiver, enhetsleder og leverandør (inkl. reisevei til og fra)\nRapportskriving\nRapportgjennomgang med arbeidstaker\nSms-dialog med arbeidstaker',
          hjemmeoppgave: '' },
      ],
      tillegg: [
        { id: 'a1', navn: 'Lisens Profilering InFlow24', pris: 400 },
      ],
      timepris: 1650,
      pris: 29700,
      mvaFritak: false,
      bruker_standardvilkår: true,
      betalingsbetingelser: 'Faktureres etterskuddsvis per måned. Forfall 14 kalenderdager. Reise- og diettkostnader spesifiseres særskilt og dekkes etter statens gjeldende satser.',
    },
  ];

  // budsjett = årlig salgsbudsjett (kr). Settes per ansatt i Innstillinger.
  const team = [
    { id: 't1', navn: 'Øyvind',                rolle: 'Daglig leder', initialer: 'ØY', epost: 'oyvind@ressurstromso.no', telefon: '',           budsjett: 0 },
    { id: 't2', navn: 'Anne Simonsen-Sagerup', rolle: 'Rådgiver',     initialer: 'AS', epost: 'anne@ressurstromso.no',   telefon: '902 77 809', budsjett: 0 },
    { id: 't3', navn: 'Gro Vidjeland',         rolle: 'Rådgiver',     initialer: 'GV', epost: 'gro@ressurstromso.no',    telefon: '934 38 114', budsjett: 0 },
    { id: 't4', navn: 'Silje',                 rolle: 'Rådgiver',     initialer: 'SI', epost: 'silje@ressurstromso.no',  telefon: '',           budsjett: 0 },
  ];

  const a = (type, dato, tittel, notat, loggetAv, beløp) => ({
    id: Math.random().toString(36).slice(2, 10),
    type, dato, tittel, notat, loggetAv, ...(beløp != null ? { beløp } : {})
  });

  // ────────────────────────────────────────────────────────────
  // KUNDER
  // ────────────────────────────────────────────────────────────
  const kunder = [
    {
      id: 'k1',
      bedriftsnavn: 'Eksempelkunde AS',
      orgnr: '',
      bransje: '',
      adresse: '',
      kontakt:  { navn: '', tittel: '', epost: '', telefon: '' },
      kontakt2: { navn: '', tittel: '', epost: '', telefon: '' },
      ansvarligId: 't1',
      pakkeId: 'p1',
      status: 'Lead',
      verdi: 0,
      sistKontakt: '2026-05-21',
      notater: 'Eksempelkunde — slett denne og legg inn deres første ekte kunde.',
      nesteAktivitet: null,
      aktiviteter: [],
    },
  ];
  // ────────────────────────────────────────────────────────────
  // SELSKAP — info som vises i tilbud, fakturahode og rapporter
  // ────────────────────────────────────────────────────────────
  const selskap = {
    navn: 'Ressurs Kompetanse AS',
    orgnr: '927 687 038',
    adresse: '',
    postnr: '',
    poststed: 'Tromsø',
    epost: '',
    telefon: '',
    web: 'www.ressurstromso.no',
    bankkonto: '',
  };

  // ────────────────────────────────────────────────────────────
  // AVTALEMAL — standardvilkår som flettes inn i tilbud
  // Plassholdere: {{KUNDE_NAVN}}, {{KUNDE_ORGNR}}, {{KUNDE_ADRESSE}},
  // {{BESTILLERNUMMER}}, {{LEVERANSEBESKRIVELSE}}, {{PAKKEPRIS}}
  // ────────────────────────────────────────────────────────────
  const avtalemal = "AVTALE OM TJENESTEYTELSER\n\nDenne avtale om tjenesteytelser (Avtalen) er inngått mellom Ressurs Kompetanse AS (Org.nr. 927 687 038) og kunde:\n\nNavn, kunde: {{KUNDE_NAVN}}\nOrg.nr.: {{KUNDE_ORGNR}}\nAdresse: {{KUNDE_ADRESSE}}\n\nMerking faktura/bestillingsnummer: {{BESTILLERNUMMER}}\n\n1. Kontraktens innhold og omfang\nRessurs Kompetanse AS tilbyr tjenester innen kompetanseheving og integrering for arbeidstakere og bedrifter. Tjenestene er særlig relatert til omstilling og karriereutvikling.\n\nRessurs Kompetanse AS har i dag inngått avtale med Kunde om: {{LEVERANSEBESKRIVELSE}}\n\n2. Vederlag og betalingsbetingelser\n\n2.1 Vederlag\nOppdraget honoreres etter medgått tid, med en ramme opp til NOK {{PAKKEPRIS}}. Med mindre annet er angitt, er alle priser oppgitt eksklusive merverdiavgift. Alle priser er i norske kroner.\nUtlegg, inklusive reise- og diettkostnader, dekkes bare i den grad de er avtalt. Reise- og diettkostnader skal spesifiseres særskilt, og dekkes etter statens gjeldende satser hvis ikke annet er avtalt. Reisetid faktureres bare hvis det er avtalt.\n\n2.2 Fakturering\nFakturering skjer etterskuddsvis pr. måned, med mindre annet er avtalt. Fakturert beløp skal gjelde den tid som er medgått frem til faktureringstidspunktet, samt eventuell dekning av utgifter påløpt i samme tidsrom.\nBetaling skal skje etter faktura per 14 kalenderdager. Ressurs Kompetanse AS fakturaer skal spesifiseres og dokumenteres slik at de kan kontrolleres av Kunden. Alle fakturaer for løpende timer skal være vedlagt detaljert spesifikasjon over påløpte timer. Utlegg og andre utgifter skal angis særskilt.\n\n2.3 Forsinkelsesrente\nHvis Kunden ikke betaler til avtalt tid, har Ressurs Kompetanse AS krav på rente av det beløp som er forfalt til betaling, i henhold til lov 17. desember 1976 nr. 100 om renter ved forsinket betaling m.m. (forsinkelsesrenteloven).\n\n2.4 Betalingsmislighold\nHvis forfalt vederlag med tillegg av forsinkelsesrenter ikke er betalt innen 30 (tretti) kalenderdager fra forfall, kan Ressurs Kompetanse AS sende skriftlig varsel til Kunden om at avtalen vil bli hevet dersom oppgjør ikke er skjedd innen 60 (seksti) kalenderdager etter at varselet er mottatt.\nHeving kan ikke skje hvis Kunden gjør opp forfalt vederlag med tillegg av forsinkelsesrenter innen fristens utløp.\n\n2.5 Prisendring\nPrisen kan endres hvert årsskifte, begrenset oppad til et beløp som tilsvarer økningen i Statistisk sentralbyrås konsumprisindeks (hovedindeksen), første gang med utgangspunkt i indeksen for den måned avtalen ble inngått, med mindre annen indeks er avtalt.\n\n3. Avbestilling\nOppdraget kan avbestilles av Kunden.\nVed avbestilling av Kunden før oppdraget er fullført skal Kunden betale det beløp Ressurs Kompetanse AS har til gode for allerede utført arbeid.\nI ethvert tilfelle har Ressurs Kompetanse AS krav på dekning av dokumenterte utlegg dersom dette er avtalt mellom partene.\n\n4. Oppsigelse\nOppdraget kan uavhengig av årsak sies opp av Ressurs Kompetanse AS.\nVed oppsigelse av oppdrag knyttet til løpende rådgivning eller veiledning, skal Kunden betale det beløp Ressurs Kompetanse AS har til gode for utført arbeid, samt dekning av dokumenterte utlegg dersom dette er avtalt mellom partene.\n\n5. Opphavs- og eiendomsrett\nRessurs Kompetanse AS beholder eiendomsrett, opphavsrett og andre relevante materielle og immaterielle rettigheter knyttet til materiell som utarbeides i anledning oppdraget. Kunden kan fritt benytte materiellet til eget bruk og til det formål det er laget for. Det er ikke tillatt uten samtykke fra Ressurs Kompetanse AS å overlevere slik materiell til tredjemann.\nRessurs Kompetanse AS beholder rettighetene til egne verktøy og metodegrunnlag. Begge parter kan også utnytte generell kunnskap (know-how) som ikke er taushetsbelagt og som de har tilegnet seg i forbindelse med bistanden.\n\n6. Taushetsplikt\nInformasjon som partene blir kjent med i forbindelse med avtalen og gjennomføringen av avtalen skal behandles konfidensielt, og ikke gjøres tilgjengelig for utenforstående uten samtykke fra den annen part.\nHvis Kunden er en offentlig virksomhet, er taushetsplikt etter denne bestemmelsen ikke mer omfattende enn det som følger av lov 10. februar 1967 om behandlingsmåten i forvaltningssaker (forvaltningsloven) eller tilsvarende sektorspesifikk regulering.\nTaushetsplikt etter denne bestemmelsen er ikke til hinder for utlevering av informasjon som kreves fremlagt i henhold til lov eller forskrift, herunder offentlighet og innsynsrett som følger av lov 19. mai 2006 om rett til innsyn i dokument i offentleg verksemd (offentleglova). Om mulig, skal den annen part varsles før slik informasjon gis.\nTaushetsplikten er ikke til hinder for at opplysningene brukes når ingen berettiget interesse tilsier at de holdes hemmelig, for eksempel når de er alminnelig kjent eller alminnelig tilgjengelig andre steder.\nPartene skal ta nødvendige forholdsregler for å sikre at uvedkommende ikke får innsyn i eller kan bli kjent med taushetsbelagt informasjon.\nTaushetsplikten gjelder partenes ansatte, underleverandører og tredjeparter som handler på partenes vegne i forbindelse med gjennomføring av avtalen. Partene kan bare overføre taushetsbelagt informasjon til slike underleverandører og tredjeparter i den utstrekning dette er nødvendig for gjennomføring av avtalen, forutsatt at disse pålegges plikt om konfidensialitet tilsvarende dette punkt.\nTaushetsplikten er ikke til hinder for at partene kan utnytte erfaring og kompetanse som opparbeides i forbindelse med gjennomføringen av avtalen.\nTaushetsplikten gjelder også etter at avtalen er opphørt.\n\n7. Kommunikasjon og kundekontakt\nKommunikasjon i forbindelse med denne Avtalen skal skje per e-post/telefon til følgende:\nFor Ressurs Kompetanse AS:\nAnne Simonsen-Sagerup, anne@ressurstromso.no, 902 77 809\nGro Vidjeland, gro@ressurstromso.no, 934 38 114\nFor Kunde: Skifte av nøkkelpersonell skal godkjennes av Kunden. Ved bytte av personell som skyldes Ressurs Kompetanse AS, bærer Ressurs Kompetanse AS kostnadene ved kompetanseoverføring til nytt personell.\n\n8. Lovvalg og verneting\nAvtalen reguleres av norsk rett.\nTvister vedrørende Avtalen skal avgjøres av de ordinære domstoler i Norge med Nord-Troms tingrett som verneting i første instans.\n\nAvtalen er inngått i to eksemplarer, hvorav ett til hver av partene.";

  return { selskap, avtalemal, pakker, team, kunder, tilbud: [], nesteTilbudsnr: 1, interneNotater: [] };
})();

window.SEED = SEED;
