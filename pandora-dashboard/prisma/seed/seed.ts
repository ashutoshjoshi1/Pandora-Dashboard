import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    username: "omar.abuhassan",
    fullName: "Omar Abuhassan",
    email: "omar.abuhassan@sciglob.com",
    password: "Omar@123",
    role: "admin",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "william.lo",
    fullName: "William Lo",
    email: "william.lo@sciglob.com",
    password: "William@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "brett.padfield",
    fullName: "Brett Padfield",
    email: "brett.padfield@sciglob.com",
    password: "Brett@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "chris.rader",
    fullName: "Chris Rader",
    email: "chris.rader@sciglob.com",
    password: "Chris@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "jonathan.gallegos",
    fullName: "Jonathan Gallegos",
    email: "jonathan.gallegos@sciglob.com",
    password: "Jonathan@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "matthew.nance",
    fullName: "Matthew Nance",
    email: "matthew.nance@sciglob.com",
    password: "Matthew@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "ashutosh.joshi",
    fullName: "Ashutosh Joshi",
    email: "ajoshi@sciglob.com",
    password: "Ashu@123",
    role: "admin",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
];

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.note.deleteMany();
  await prisma.cardCustomField.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.card.deleteMany();
  await prisma.boardList.deleteMany();
  await prisma.board.deleteMany();
  await prisma.customFieldDefinition.deleteMany();
  await prisma.label.deleteMany();
  await prisma.userWorkspaceAccess.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users: Record<string, string> = {};
  for (const u of SEED_USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.create({
      data: {
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        passwordHash: hash,
        role: u.role,
        active: u.active,
      },
    });
    users[u.username] = user.id;
    console.log(`  User: ${u.username} (${u.role})`);
  }

  // Create workspaces
  const sciglob = await prisma.workspace.create({
    data: {
      name: "SciGlob's",
      slug: "sciglob",
      description:
        "SciGlob Instruments & Services — Pandora spectrometer instrument lifecycle management",
      color: "#2a7a4a",
      icon: "flask",
    },
  });

  const nasaGsfc = await prisma.workspace.create({
    data: {
      name: "NASA GSFC",
      slug: "nasa-gsfc",
      description:
        "NASA Goddard Space Flight Center — Instrument calibration, clearance, and deployment tracking",
      color: "#3266ad",
      icon: "satellite",
    },
  });

  console.log("  Workspaces created");

  // Grant workspace access
  for (const u of SEED_USERS) {
    for (const ws of u.workspaceAccess) {
      const wsId = ws === "sciglob" ? sciglob.id : nasaGsfc.id;
      await prisma.userWorkspaceAccess.create({
        data: {
          userId: users[u.username],
          workspaceId: wsId,
          role: u.role,
        },
      });
    }
  }

  // Create labels
  const labelRepair = await prisma.label.create({
    data: { name: "Repair", color: "#ef4444" },
  });
  const labelClearing = await prisma.label.create({
    data: { name: "Clearing", color: "#f59e0b" },
  });
  const labelNewBuild = await prisma.label.create({
    data: { name: "New Build", color: "#22c55e" },
  });
  const labelUrgent = await prisma.label.create({
    data: { name: "Urgent", color: "#dc2626" },
  });
  const labelOnHold = await prisma.label.create({
    data: { name: "On Hold", color: "#6b7280" },
  });

  // Create custom field definitions
  const fieldDefs = [
    { name: "Model", type: "select", options: '["1s","2s"]' },
    {
      name: "Dehumidifier",
      type: "select",
      options: '["Yes","No","N/A"]',
    },
    {
      name: "Spectrometer Type",
      type: "select",
      options: '["USB 3.0 Sensline","USB 2.0","USB 4000","HR4000","Custom"]',
    },
    {
      name: "USB Hub",
      type: "select",
      options: '["Yes - through PS","No","N/A"]',
    },
    {
      name: "Fiber Type & Length",
      type: "select",
      options: '["UV 15M","UV 10M","VIS 15M","UV 5M","Custom"]',
    },
    {
      name: "Enclosure Type",
      type: "select",
      options: '["Field Enclosure","Lab Enclosure","Standard","Custom"]',
    },
    {
      name: "PC Type",
      type: "select",
      options: '["ASUS","Dell","Intel NUC","Raspberry Pi","Custom"]',
    },
    {
      name: "FW Assembly",
      type: "select",
      options: '["Shim","Standard","Custom"]',
    },
    {
      name: "FW Type",
      type: "select",
      options: '["JLC 3DP Standard","JLC 3DP Custom","Metal","Legacy"]',
    },
    { name: "bearing greased", type: "select", options: '["Yes","No","N/A"]' },
    {
      name: "FW Screw Type",
      type: "select",
      options: '["Original Pan Head","Phillips","Hex","Custom"]',
    },
    { name: "Custom Optics?", type: "select", options: '["Yes","No","N/A"]' },
    {
      name: "Fiber Connector Type",
      type: "select",
      options: '["JLC","SMA","FC","Custom"]',
    },
  ];

  const fields: Record<string, string> = {};
  for (const fd of fieldDefs) {
    const f = await prisma.customFieldDefinition.create({ data: fd });
    fields[fd.name] = f.id;
  }
  console.log("  Custom fields created");

  // ── SciGlob Board ──
  const sciglobBoard = await prisma.board.create({
    data: {
      name: "Instrument Tracking",
      slug: "instrument-tracking",
      description: "Main Pandora instrument production and repair tracking board",
      workspaceId: sciglob.id,
    },
  });

  const sciglobLists = [
    { name: "TO DO - New Production", position: 0, color: "#ef4444" },
    { name: "ON ROOF", position: 1, color: "#22c55e" },
    { name: "Lab", position: 2, color: "#3b82f6" },
    { name: "Lab Range", position: 3, color: "#8b5cf6" },
    { name: "ORDER REQUESTS / INV", position: 4, color: "#f59e0b" },
    { name: "Cal / Clear at GSFC", position: 5, color: "#06b6d4" },
    { name: "SHIPPED FROM SCIGLOB", position: 6, color: "#10b981" },
    { name: "GSFC SHIPPED", position: 7, color: "#6366f1" },
    { name: "SCIGLOB REPAIRS", position: 8, color: "#f97316" },
  ];

  const listIds: Record<string, string> = {};
  for (const l of sciglobLists) {
    const list = await prisma.boardList.create({
      data: { ...l, boardId: sciglobBoard.id },
    });
    listIds[l.name] = list.id;
  }

  // ── Seed cards for SciGlob board ──
  // Based on Trello screenshots analysis

  // TO DO - New Production
  const todoCards = [
    {
      title: "Check rooftop instruments",
      description: "Check rooftop instruments (#8 needs #1, the 12, axis wrong)",
      position: 0,
    },
    {
      title: "83 remove filter extender",
      description: "Remove filter extender from unit 83",
      position: 1,
    },
    {
      title: "Updating Manuals",
      description: "Updating manuals - df's, fl, and other documentation",
      position: 2,
    },
    {
      title: "Diode plug check",
      description:
        "Check diag of relay bus to verify to make sure its has correct pinout configuration",
      position: 3,
    },
    {
      title: "302 TM rack upgrades",
      description: "302 TM rack upgrades",
      position: 4,
    },
    {
      title: "BUILD IS BACK FOR PANDORA 232",
      description: "Build is back for Pandora 232 - needs repair and upgrade",
      position: 5,
    },
    {
      title: "Fix Tracker on TUA",
      description: "Fix Tracker on TUA moves very slow",
      position: 6,
    },
    {
      title: "Need to see if P2 F13 fix",
      description: "Need to see if P2 F13 fix too much offset",
      position: 7,
    },
    {
      title: "Need to print another sh holder",
      description:
        "Need to print another sh holder for the connector. Can be used for TS and DS T",
      position: 8,
    },
    {
      title: "310s1 is out preparing for cold testing",
      description: "310s1 is out and being prepared for cold testing",
      position: 9,
    },
    {
      title: "Build new 2S enclosures and Sh",
      description: "Build new 2S enclosures and sensor heads with updated design",
      position: 10,
    },
    {
      title: "NF awaiting SPEC",
      description: "NF awaiting spectrometer",
      position: 11,
    },
    {
      title: "83 check filter",
      description: "Check filter alignment on unit 83",
      position: 12,
    },
  ];

  for (const c of todoCards) {
    await prisma.card.create({
      data: {
        ...c,
        listId: listIds["TO DO - New Production"],
        labels: {
          create: { labelId: labelNewBuild.id },
        },
      },
    });
  }

  // ON ROOF cards - instrument units currently on the roof for testing
  const onRoofCards = [
    {
      title: "315 s1",
      description: "PAN SLIP - PRE CAL 1 - 4/9/26",
      labels: [labelNewBuild.id, labelClearing.id],
      customFields: {
        Model: "1s",
        "Spectrometer Type": "USB 3.0 Sensline",
        "Fiber Type & Length": "UV 15M",
        "Enclosure Type": "Field Enclosure",
        "PC Type": "ASUS",
        "FW Assembly": "Shim",
        "FW Type": "JLC 3DP Standard",
        "Fiber Connector Type": "JLC",
        Dehumidifier: "MJ7",
      },
      comments: [
        {
          author: "omar.abuhassan",
          content:
            "NL Taking full unit to GSFC for cal\n\nSlip Complete\n\noslog clear - only warnings from SBHS sensor, blck bug no issue.",
          date: "2026-04-09T17:38:00Z",
        },
        {
          author: "chris.rader",
          content: "Updated blck → 1.8.93, integrated SBHS",
          date: "2026-03-24T16:55:00Z",
        },
        {
          author: "brett.padfield",
          content:
            "SH came down, suspected dirty fiber on the SH side, removed fiber, tiny specs, cleaned, re wrapped, aligned, and replaced fiber o-ring.",
          date: "2026-03-24T11:59:00Z",
        },
        {
          author: "william.lo",
          content:
            "Brought Pan 315 whole unit up to the roof. Did F1 and finished aligning. Running fndftu15-> align.sked.",
          date: "2026-03-18T16:03:00Z",
        },
        {
          author: "matthew.nance",
          content:
            "Pan 315. I checked both sets of crimps: tracker pigtail and spec, neither had solder. I had to cut the spec cable to redo the crimps and it almost made it too short. We will have to verify if the length is acceptable. Tracker 2 Pin Plug has been taken apart and solder is put on the wires. Good to go.",
          date: "2026-03-17T17:16:00Z",
        },
      ],
    },
    {
      title: "93s1",
      description: "PAN 91 SLIP",
      labels: [labelNewBuild.id, labelClearing.id],
      customFields: {
        Model: "1s",
        "Spectrometer Type": "USB 3.0 Sensline",
        Dehumidifier: "MJ7",
        "Enclosure Type": "Field Enclosure",
      },
      comments: [
        {
          author: "chris.rader",
          content: "Updated blck → 1.8.93, integrated SBHS",
          date: "2026-03-24T16:45:00Z",
        },
        {
          author: "william.lo",
          content:
            "The whole unit was brought up to the roof to do more testing. Running fndftu15->align sked, and UV sun moon sky sked.",
          date: "2026-03-24T11:01:00Z",
        },
        {
          author: "omar.abuhassan",
          content:
            "Tested overweekend in chamber at -5C. SH Temp at 0C\n\nLZ & ZL good, ran both numerous times\n\nclean oslog",
          date: "2026-03-23T11:52:00Z",
        },
        {
          author: "omar.abuhassan",
          content:
            "FW is slightly louder than 312 testing beside it, grinds louder, but never locked up or error",
          date: "2026-03-23T11:52:00Z",
        },
        {
          author: "omar.abuhassan",
          content:
            "Tested overnight in chamber\n\nHEAT 55C / 60C\n\nInternal SH Temp 60C overnight\n\nLZ & ZL & Manual ALL GOOD",
          date: "2026-03-18T11:57:00Z",
        },
        {
          author: "william.lo",
          content:
            "Pan 93 is in the conference room doing a chamber test. Testing with 60 Celsius degree. Running UV. Sun. Sked.",
          date: "2026-03-16T15:59:00Z",
        },
        {
          author: "omar.abuhassan",
          content: "SS took full unit to GSFC for calibration",
          date: "2024-10-30T13:48:00Z",
        },
      ],
    },
  ];

  for (const c of onRoofCards) {
    const card = await prisma.card.create({
      data: {
        title: c.title,
        description: c.description,
        listId: listIds["ON ROOF"],
        position: onRoofCards.indexOf(c),
        labels: {
          create: c.labels.map((lid) => ({ labelId: lid })),
        },
      },
    });

    // Custom fields
    if (c.customFields) {
      for (const [fname, fval] of Object.entries(c.customFields)) {
        if (fields[fname]) {
          await prisma.cardCustomField.create({
            data: {
              cardId: card.id,
              fieldId: fields[fname],
              value: fval,
            },
          });
        }
      }
    }

    // Comments
    if (c.comments) {
      for (const cm of c.comments) {
        await prisma.comment.create({
          data: {
            content: cm.content,
            cardId: card.id,
            authorId: users[cm.author],
            createdAt: new Date(cm.date),
          },
        });
        await prisma.activity.create({
          data: {
            type: "comment_added",
            detail: `Comment added by ${cm.author}`,
            cardId: card.id,
            userId: users[cm.author],
            createdAt: new Date(cm.date),
          },
        });
      }
    }
  }

  // Lab cards
  const labCards = [
    { title: "Print PC with Humidosto...", position: 0 },
    { title: "232s1", position: 1 },
    { title: "271s1", position: 2 },
    { title: "310s2-DR", position: 3 },
    { title: "312 c1", position: 4 },
    { title: "PAK-C V2", position: 5 },
    { title: "TUBG1", position: 6 },
    { title: "Tubed", position: 7 },
    { title: "311s1", position: 8 },
  ];
  for (const c of labCards) {
    await prisma.card.create({
      data: { ...c, listId: listIds["Lab"] },
    });
  }

  // Lab Range
  const labRangeCards = [
    { title: "234 sh-eycp", position: 0 },
    { title: "135s1", position: 1 },
    { title: "140s1", position: 2 },
    { title: "308s1", position: 3 },
    { title: "313s1", position: 4 },
    { title: "84s1", position: 5 },
  ];
  for (const c of labRangeCards) {
    await prisma.card.create({
      data: { ...c, listId: listIds["Lab Range"] },
    });
  }

  // ORDER REQUESTS / INV
  const orderCards = [
    {
      title: "HARDWARE/GENERAL ORDERS",
      description: "General hardware orders tracking",
      position: 0,
    },
    {
      title: "Quality Check for Pandora parts 2025",
      description: "Quality check process for incoming Pandora parts - 2025 batch",
      position: 1,
      labels: [labelUrgent.id],
    },
    {
      title: "Quality Check for Pandora parts 2026",
      description: "Quality check process for incoming Pandora parts - 2026 batch",
      position: 2,
    },
  ];
  for (const c of orderCards) {
    const card = await prisma.card.create({
      data: {
        title: c.title,
        description: c.description,
        listId: listIds["ORDER REQUESTS / INV"],
        position: c.position,
      },
    });
    if (c.labels) {
      for (const lid of c.labels) {
        await prisma.cardLabel.create({
          data: { cardId: card.id, labelId: lid },
        });
      }
    }
  }

  // Cal / Clear at GSFC
  const calCards = [
    { title: "191s1", position: 0 },
    { title: "87s1", position: 1 },
    { title: "291s1", position: 2 },
    { title: "292s1", position: 3 },
    { title: "224s1", position: 4 },
    { title: "310s1", position: 5 },
    { title: "B041", position: 6 },
    { title: "B042", position: 7 },
    { title: "B043", position: 8 },
    { title: "B044", position: 9 },
  ];
  for (const c of calCards) {
    await prisma.card.create({
      data: { ...c, listId: listIds["Cal / Clear at GSFC"] },
    });
  }

  // SHIPPED FROM SCIGLOB
  const shippedCards = [
    { title: "87s1", position: 0 },
    { title: "191s1", position: 1 },
    { title: "291s1", position: 2 },
    { title: "292s1", position: 3 },
    { title: "DPR", position: 4 },
    { title: "N/A", position: 5 },
    { title: "224s1", position: 6 },
    { title: "310s1", position: 7 },
    { title: "B041", position: 8 },
    { title: "B042", position: 9 },
    { title: "B043", position: 10 },
    { title: "B044", position: 11 },
  ];
  for (const c of shippedCards) {
    await prisma.card.create({
      data: { ...c, listId: listIds["SHIPPED FROM SCIGLOB"] },
    });
  }

  // GSFC SHIPPED
  const gsfcShippedCards = [
    { title: "85s1", position: 0 },
    { title: "3s1", position: 1 },
    { title: "1s1", position: 2 },
    { title: "281 - Wassilewsky", position: 3 },
    { title: "289s1", position: 4 },
    { title: "270s1", position: 5 },
    { title: "R0s1", position: 6 },
    { title: "289s1", position: 7 },
  ];
  for (const c of gsfcShippedCards) {
    await prisma.card.create({
      data: { ...c, listId: listIds["GSFC SHIPPED"] },
    });
  }

  // SCIGLOB REPAIRS
  const repairCards = [
    { title: "list of repair", position: 0 },
    { title: "add repair1", position: 1 },
    { title: "pandora repair", position: 2 },
    { title: "konica repair", position: 3 },
  ];
  for (const c of repairCards) {
    const card = await prisma.card.create({
      data: {
        ...c,
        listId: listIds["SCIGLOB REPAIRS"],
        labels: { create: { labelId: labelRepair.id } },
      },
    });
    await prisma.activity.create({
      data: {
        type: "card_created",
        detail: `Card "${c.title}" created`,
        cardId: card.id,
        userId: users["omar.abuhassan"],
      },
    });
  }

  // Card with full detail: 85s1 (from screenshot)
  const card85 = await prisma.card.create({
    data: {
      title: "85s1",
      description: "Pan 85 slip 11/27/24",
      listId: listIds["GSFC SHIPPED"],
      position: 0,
      labels: {
        create: [
          { labelId: labelRepair.id },
          { labelId: labelClearing.id },
        ],
      },
    },
  });

  // Comments for 85s1
  const comments85 = [
    {
      author: "omar.abuhassan",
      content:
        "Sent back to Xavier uni post repairs from GSFC 07/26/2025",
      date: "2025-10-28T11:56:00Z",
    },
    {
      author: "jonathan.gallegos",
      content:
        "SH and Spec were brought down from the roof, it's in the lab in the rack",
      date: "2024-11-27T15:48:00Z",
    },
    {
      author: "omar.abuhassan",
      content: "Testing on roof . SH and spec on TUA sci",
      date: "2024-10-21T14:39:00Z",
    },
    {
      author: "william.lo",
      content:
        "changed the shims.\n\nFilter wheel 1 has a thin teflon shim and a 3D printed shim\n\nFilter wheel 2 has a 3D printed shim",
      date: "2024-10-08T15:44:00Z",
    },
    {
      author: "william.lo",
      content:
        "Pressure tested for 10 minutes, no drop in pressure.\n\nNoticed",
      date: "2024-10-08T15:42:00Z",
    },
    {
      author: "william.lo",
      content:
        "SH and spec received. Intake complete\n\nHumidity 49% - Desiccant bags were in SH\n\nPressure 100433",
      date: "2024-10-08T14:36:00Z",
    },
  ];
  for (const cm of comments85) {
    await prisma.comment.create({
      data: {
        content: cm.content,
        cardId: card85.id,
        authorId: users[cm.author],
        createdAt: new Date(cm.date),
      },
    });
  }

  // ── NASA GSFC Board ──
  const gsfcBoard = await prisma.board.create({
    data: {
      name: "GSFC Calibration Pipeline",
      slug: "calibration-pipeline",
      description:
        "NASA GSFC Pandora calibration and clearance tracking",
      workspaceId: nasaGsfc.id,
    },
  });

  const gsfcLists = [
    { name: "Incoming from SciGlob", position: 0, color: "#f59e0b" },
    { name: "Roof Deployment", position: 1, color: "#22c55e" },
    { name: "Data Collection", position: 2, color: "#3b82f6" },
    { name: "Data Processing", position: 3, color: "#8b5cf6" },
    { name: "Clearance Review", position: 4, color: "#06b6d4" },
    { name: "Cleared - Ready to Ship", position: 5, color: "#10b981" },
    { name: "Shipped to Site", position: 6, color: "#6366f1" },
  ];

  const gsfcListIds: Record<string, string> = {};
  for (const l of gsfcLists) {
    const list = await prisma.boardList.create({
      data: { ...l, boardId: gsfcBoard.id },
    });
    gsfcListIds[l.name] = list.id;
  }

  // NASA GSFC sample cards
  const gsfcCards = [
    {
      title: "#252 - Standard Repair",
      description: "Jan 2026 - clearing. Standard repair, 1 calibration.",
      listId: gsfcListIds["Clearance Review"],
      position: 0,
    },
    {
      title: "#58 - Awaiting First Calibration",
      description: "Unit from 2018. Awaiting 1st calibration cycle.",
      listId: gsfcListIds["Incoming from SciGlob"],
      position: 0,
    },
    {
      title: "#111 - Complex Repair",
      description: "Unit from 2015. New build sensor head required. Complex classification.",
      listId: gsfcListIds["Data Processing"],
      position: 0,
    },
    {
      title: "#210 - Complex Repair",
      description: "Unit from 2021. 2 calibrations required. Complex classification.",
      listId: gsfcListIds["Data Collection"],
      position: 0,
    },
    {
      title: "#24 - Worst Case Repair",
      description: "Unit from 2018. Worst case classification. 2 calibrations.",
      listId: gsfcListIds["Roof Deployment"],
      position: 0,
    },
    {
      title: "#57 - Extended Calibration",
      description:
        "Unit from 2018. Worst case classification. 10 calibrations required. Extended calibration validation.",
      listId: gsfcListIds["Data Processing"],
      position: 1,
    },
    {
      title: "#286 - New Build 1S",
      description: "New 1S standard build. 2025. 1 calibration.",
      listId: gsfcListIds["Incoming from SciGlob"],
      position: 1,
    },
    {
      title: "#295 - New Build 2S",
      description: "New 2S dual spectrometer build. 2025. 1 calibration.",
      listId: gsfcListIds["Roof Deployment"],
      position: 1,
    },
    {
      title: "#230 - Worst Case 2S",
      description:
        "Aug 2025 - Feb 2026. 2S unit. Worst case classification. 2 calibrations.",
      listId: gsfcListIds["Cleared - Ready to Ship"],
      position: 0,
    },
    {
      title: "#290 - Filter Wheel Issue",
      description: "2025 build. 1S Complex. Filter wheel issue requiring 2 calibrations.",
      listId: gsfcListIds["Data Collection"],
      position: 1,
    },
  ];

  for (const c of gsfcCards) {
    await prisma.card.create({
      data: {
        title: c.title,
        description: c.description,
        listId: c.listId,
        position: c.position,
      },
    });
  }

  // Additional cards with second workspace owner's project
  const ownerBoard = await prisma.board.create({
    data: {
      name: "Owner's Projects",
      slug: "owners-projects",
      description: "Personal project tracking",
      workspaceId: sciglob.id,
      position: 1,
    },
  });

  const ownerLists = [
    { name: "To Do", position: 0, color: "#ef4444" },
    { name: "In Progress", position: 1, color: "#f59e0b" },
    { name: "Done", position: 2, color: "#22c55e" },
  ];

  for (const l of ownerLists) {
    const list = await prisma.boardList.create({
      data: { ...l, boardId: ownerBoard.id },
    });

    if (l.name === "To Do") {
      await prisma.card.create({
        data: {
          title: "Three Sarges aluminum case",
          description: "Three Sarges aluminum case project",
          listId: list.id,
          position: 0,
        },
      });
      await prisma.card.create({
        data: {
          title: "One pelican case",
          description: "One pelican case preparation",
          listId: list.id,
          position: 1,
        },
      });
    }
  }

  // ── Attach ALL custom fields to EVERY card ──
  // Ensure every card has a row for every custom field definition,
  // filling in null for any that weren't explicitly seeded above.
  const allCards = await prisma.card.findMany({ select: { id: true } });
  const allFieldDefs = await prisma.customFieldDefinition.findMany({ select: { id: true } });
  const existingCFs = await prisma.cardCustomField.findMany({
    select: { cardId: true, fieldId: true },
  });
  const existingSet = new Set(existingCFs.map((cf) => `${cf.cardId}:${cf.fieldId}`));

  const missingRows: { cardId: string; fieldId: string; value: null }[] = [];
  for (const card of allCards) {
    for (const field of allFieldDefs) {
      if (!existingSet.has(`${card.id}:${field.id}`)) {
        missingRows.push({ cardId: card.id, fieldId: field.id, value: null });
      }
    }
  }

  if (missingRows.length > 0) {
    await prisma.cardCustomField.createMany({ data: missingRows });
    console.log(`  Attached ${missingRows.length} missing custom field slots across ${allCards.length} cards`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
