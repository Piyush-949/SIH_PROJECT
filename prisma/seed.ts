import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("ðŸŒ± [KRISHI SETU] Starting High-Fidelity Database Seed...");

  // 1. Clean up existing records in cascading order
  console.log("ðŸ§¹ Cleaning up old records...");
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentBoostRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.procurementRecord.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.operationalIncident.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.centreCrop.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.procurementCentre.deleteMany();
  await prisma.govRegistry.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Mock Government Registry (GovRegistry) - 30 Verified Farmers
  console.log("ðŸ›ï¸  Seeding Mock Government Registry (Aadhaar + Kisan ID DB)...");
  const govFarmersData = [
    { aadhaar: "123456789012", kisanId: "KID-MH-2026-001", name: "Rameshwar Patil", state: "Maharashtra", district: "Nagpur", village: "Pipla", pincode: "440001", land: 4.5 },
    { aadhaar: "234567890123", kisanId: "KID-HR-2024-8892", name: "Suresh Patel", state: "Haryana", district: "Karnal", village: "Gharaunda", pincode: "132114", land: 6.2 },
    { aadhaar: "345678901234", kisanId: "KID-PB-2024-1101", name: "Harpreet Kaur", state: "Punjab", district: "Ludhiana", village: "Samrala", pincode: "141114", land: 12.0 },
    { aadhaar: "456789012345", kisanId: "KID-PB-2024-1102", name: "Baldev Singh", state: "Punjab", district: "Ludhiana", village: "Khanna", pincode: "141401", land: 15.5 },
    { aadhaar: "567890123456", kisanId: "KID-PB-2024-1103", name: "Gurpreet Singh", state: "Punjab", district: "Ludhiana", village: "Doraha", pincode: "141421", land: 9.0 },
    { aadhaar: "678901234567", kisanId: "KID-MP-2024-3011", name: "Amit Sharma", state: "Madhya Pradesh", district: "Indore", village: "Sanwer", pincode: "453551", land: 7.5 },
    { aadhaar: "789012345678", kisanId: "KID-MP-2024-3012", name: "Rajesh Yadav", state: "Madhya Pradesh", district: "Indore", village: "Depalpur", pincode: "453115", land: 11.2 },
    { aadhaar: "890123456789", kisanId: "KID-MP-2024-3013", name: "Sunita Devi", state: "Madhya Pradesh", district: "Indore", village: "Mhow", pincode: "453441", land: 4.8 },
    { aadhaar: "901234567890", kisanId: "KID-HR-2024-8893", name: "Jagdish Prasad", state: "Haryana", district: "Karnal", village: "Nilokheri", pincode: "132117", land: 10.0 },
    { aadhaar: "112233445566", kisanId: "KID-PB-2024-1104", name: "Manjeet Singh", state: "Punjab", district: "Ludhiana", village: "Jagraon", pincode: "142026", land: 18.0 },
    { aadhaar: "223344556677", kisanId: "KID-HR-2024-8894", name: "Satnam Singh", state: "Haryana", district: "Karnal", village: "Assandh", pincode: "132039", land: 14.2 },
    { aadhaar: "334455667788", kisanId: "KID-RJ-2024-5501", name: "Mohan Lal", state: "Rajasthan", district: "Kota", village: "Sangod", pincode: "325601", land: 5.5 },
    { aadhaar: "445566778899", kisanId: "KID-HR-2024-8895", name: "Kuldeep Yadav", state: "Haryana", district: "Karnal", village: "Indri", pincode: "132041", land: 28.0 }, // Large quantity farmer
    { aadhaar: "556677889900", kisanId: "KID-MP-2024-3014", name: "Kavita Bai", state: "Madhya Pradesh", district: "Indore", village: "Hatod", pincode: "453111", land: 6.0 },
    { aadhaar: "667788990011", kisanId: "KID-MH-2024-7001", name: "Dharmendra Patil", state: "Maharashtra", district: "Nashik", village: "Dindori", pincode: "422202", land: 8.0 },
    { aadhaar: "778899001122", kisanId: "KID-MH-2024-7002", name: "Vijay Deshmukh", state: "Maharashtra", district: "Nashik", village: "Niphad", pincode: "422303", land: 13.5 },
    { aadhaar: "889900112233", kisanId: "KID-TS-2024-9001", name: "Ravinder Reddy", state: "Telangana", district: "Warangal", village: "Geesugonda", pincode: "506330", land: 9.5 },
    { aadhaar: "990011223344", kisanId: "KID-RJ-2024-5502", name: "Prakash Chandra", state: "Rajasthan", district: "Kota", village: "Ramganj Mandi", pincode: "326519", land: 7.0 },
    { aadhaar: "102938475610", kisanId: "KID-UP-2024-4001", name: "Santosh Kumar", state: "Uttar Pradesh", district: "Meerut", village: "Sardhana", pincode: "250342", land: 11.0 },
    { aadhaar: "203948576120", kisanId: "KID-RJ-2024-5503", name: "Vikram Rathore", state: "Rajasthan", district: "Kota", village: "Ladpura", pincode: "324001", land: 8.5 },
    { aadhaar: "304958677230", kisanId: "KID-HR-2024-8896", name: "Rajendra Meena", state: "Haryana", district: "Karnal", village: "Kunjpura", pincode: "132022", land: 6.5 },
    { aadhaar: "405968788340", kisanId: "KID-GJ-2024-6001", name: "Bharat Patel", state: "Gujarat", district: "Rajkot", village: "Gondal", pincode: "360311", land: 16.0 },
    { aadhaar: "506978899450", kisanId: "KID-UP-2024-4002", name: "Mahesh Tyagi", state: "Uttar Pradesh", district: "Meerut", village: "Mawana", pincode: "250401", land: 10.5 },
    { aadhaar: "607988900560", kisanId: "KID-TS-2024-9002", name: "Kiran Rao", state: "Telangana", district: "Warangal", village: "Wardhannapet", pincode: "506313", land: 7.2 },
    { aadhaar: "708999011670", kisanId: "KID-MP-2024-3015", name: "Devendra Lodhi", state: "Madhya Pradesh", district: "Jabalpur", village: "Panagar", pincode: "483220", land: 14.0 },
  ];

  for (const item of govFarmersData) {
    await prisma.govRegistry.create({
      data: {
        aadhaarNumber: item.aadhaar,
        kisanId: item.kisanId,
        farmerName: item.name,
        state: item.state,
        district: item.district,
        village: item.village,
        pincode: item.pincode,
        registeredLandAcres: item.land,
        active: true,
      },
    });
  }

  // 3. Seed 4 Major Crops with official MSP Rates (2025-2026 Kharif/Rabi)
  console.log("ðŸŒ¾ Seeding 4 Major Crops with official MSP rates & Agmarknet standards...");
  const cropsData = [
    {
      name: "Wheat",
      nameHindi: "à¤—à¥‡à¤¹à¥‚à¤‚ (Kanak)",
      category: "Cereals",
      basePricePerQuintal: 2275.0, // â‚¹2,275 / Q
      moistureStandardMax: 12.0,
      foreignMaterialMax: 2.0,
      damagedGrainMax: 3.0,
      baseProcessingMinutesPerQuintal: 0.8,
    },
    {
      name: "Paddy",
      nameHindi: "à¤§à¤¾à¤¨ (Rice)",
      category: "Cereals",
      basePricePerQuintal: 2183.0, // â‚¹2,183 / Q
      moistureStandardMax: 17.0,
      foreignMaterialMax: 1.0,
      damagedGrainMax: 4.0,
      baseProcessingMinutesPerQuintal: 0.9,
    },
    {
      name: "Maize",
      nameHindi: "à¤®à¤•à¥à¤•à¤¾ (Corn)",
      category: "Cereals",
      basePricePerQuintal: 2090.0, // â‚¹2,090 / Q
      moistureStandardMax: 14.0,
      foreignMaterialMax: 2.0,
      damagedGrainMax: 3.0,
      baseProcessingMinutesPerQuintal: 0.7,
    },
    {
      name: "Soybean",
      nameHindi: "à¤¸à¥‹à¤¯à¤¾à¤¬à¥€à¤¨ (Yellow)",
      category: "Oilseeds",
      basePricePerQuintal: 4600.0, // â‚¹4,600 / Q
      moistureStandardMax: 12.0,
      foreignMaterialMax: 2.0,
      damagedGrainMax: 2.0,
      baseProcessingMinutesPerQuintal: 0.85,
    },
  ];

  const createdCrops: Record<string, any> = {};
  for (const c of cropsData) {
    const cropRecord = await prisma.crop.create({ data: c });
    createdCrops[c.name] = cropRecord;
  }

  // 4. Seed 12 Strategic Procurement Centres Across India
  console.log("ðŸ¢ Seeding 12 Procurement Centres with capacities, coordinates & operational metrics...");
  const centresData = [
    {
      name: "Karnal Central APMC Mandi",
      code: "PC-HR-001",
      latitude: 29.6857,
      longitude: 76.9907,
      address: "GT Road, Sector 3, Karnal",
      district: "Karnal",
      state: "Haryana",
      pincode: "132001",
      contactPhone: "+91-184-2250100",
      capacityPerDayQuintals: 1200.0,
      currentLoadQuintals: 1104.0, // 92% Congested (RED)
      processingSpeedPerHour: 120.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 3,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 1, // 1 Machine Down
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "CONGESTED" as const,
    },
    {
      name: "Nilokheri Cooperative PACS Centre",
      code: "PC-HR-002",
      latitude: 29.8333,
      longitude: 76.9167,
      address: "Mandi Road, Nilokheri",
      district: "Karnal",
      state: "Haryana",
      pincode: "132117",
      contactPhone: "+91-184-2281200",
      capacityPerDayQuintals: 800.0,
      currentLoadQuintals: 304.0, // 38% Low (GREEN - Recommended Reroute)
      processingSpeedPerHour: 90.0,
      operatingHours: "08:30 AM - 05:30 PM",
      activeCounters: 2,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "ACTIVE" as const,
    },
    {
      name: "Ludhiana Main Grain Mandi",
      code: "PC-PB-001",
      latitude: 30.9010,
      longitude: 75.8573,
      address: "Gill Road, Grain Market, Ludhiana",
      district: "Ludhiana",
      state: "Punjab",
      pincode: "141003",
      contactPhone: "+91-161-2401122",
      capacityPerDayQuintals: 1600.0,
      currentLoadQuintals: 1088.0, // 68% Moderate (YELLOW)
      processingSpeedPerHour: 140.0,
      operatingHours: "07:30 AM - 06:30 PM",
      activeCounters: 4,
      weighingMachinesTotal: 3,
      weighingMachinesActive: 3,
      moistureMetersTotal: 3,
      moistureMetersActive: 3,
      status: "ACTIVE" as const,
    },
    {
      name: "Khanna Asia Largest Grain Market",
      code: "PC-PB-002",
      latitude: 30.7067,
      longitude: 76.2167,
      address: "GT Road, Khanna Mandi Complex",
      district: "Ludhiana",
      state: "Punjab",
      pincode: "141401",
      contactPhone: "+91-1628-220044",
      capacityPerDayQuintals: 2200.0,
      currentLoadQuintals: 990.0, // 45% (GREEN)
      processingSpeedPerHour: 180.0,
      operatingHours: "07:00 AM - 07:00 PM",
      activeCounters: 5,
      weighingMachinesTotal: 4,
      weighingMachinesActive: 4,
      moistureMetersTotal: 4,
      moistureMetersActive: 4,
      status: "ACTIVE" as const,
    },
    {
      name: "Indore Krishi Upaj Mandi",
      code: "PC-MP-001",
      latitude: 22.7196,
      longitude: 75.8577,
      address: "Laxmi Bai Nagar, Mandi Campus, Indore",
      district: "Indore",
      state: "Madhya Pradesh",
      pincode: "452006",
      contactPhone: "+91-731-2415500",
      capacityPerDayQuintals: 1000.0,
      currentLoadQuintals: 880.0, // 88% (RED)
      processingSpeedPerHour: 100.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 3,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "CONGESTED" as const,
    },
    {
      name: "Sanwer PACS Sub-Centre",
      code: "PC-MP-002",
      latitude: 22.9781,
      longitude: 75.8340,
      address: "Ujjain Road, Sanwer",
      district: "Indore",
      state: "Madhya Pradesh",
      pincode: "453551",
      contactPhone: "+91-732-224410",
      capacityPerDayQuintals: 600.0,
      currentLoadQuintals: 180.0, // 30% (GREEN)
      processingSpeedPerHour: 70.0,
      operatingHours: "08:30 AM - 05:00 PM",
      activeCounters: 2,
      weighingMachinesTotal: 1,
      weighingMachinesActive: 1,
      moistureMetersTotal: 1,
      moistureMetersActive: 1,
      status: "ACTIVE" as const,
    },
    {
      name: "Nashik Agricultural Produce Mandi",
      code: "PC-MH-001",
      latitude: 19.9975,
      longitude: 73.7898,
      address: "Panchavati Market Yard, Nashik",
      district: "Nashik",
      state: "Maharashtra",
      pincode: "422003",
      contactPhone: "+91-253-2511400",
      capacityPerDayQuintals: 950.0,
      currentLoadQuintals: 684.0, // 72% (YELLOW)
      processingSpeedPerHour: 85.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 3,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "ACTIVE" as const,
    },
    {
      name: "Warangal Cotton & Grain Complex",
      code: "PC-TS-001",
      latitude: 17.9689,
      longitude: 79.5941,
      address: "Enamamula Mandi Yard, Warangal",
      district: "Warangal",
      state: "Telangana",
      pincode: "506002",
      contactPhone: "+91-870-2448822",
      capacityPerDayQuintals: 1100.0,
      currentLoadQuintals: 572.0, // 52% (GREEN)
      processingSpeedPerHour: 110.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 3,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "ACTIVE" as const,
    },
    {
      name: "Kota Krishi Upaj Mandi",
      code: "PC-RJ-001",
      latitude: 25.1764,
      longitude: 75.8648,
      address: "Bhamashah Mandi, Anantpura, Kota",
      district: "Kota",
      state: "Rajasthan",
      pincode: "324005",
      contactPhone: "+91-744-2490300",
      capacityPerDayQuintals: 1300.0,
      currentLoadQuintals: 845.0, // 65% (YELLOW)
      processingSpeedPerHour: 115.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 4,
      weighingMachinesTotal: 3,
      weighingMachinesActive: 3,
      moistureMetersTotal: 3,
      moistureMetersActive: 3,
      status: "ACTIVE" as const,
    },
    {
      name: "Jabalpur Krishi Upaj Mandi",
      code: "PC-MP-003",
      latitude: 23.1815,
      longitude: 79.9864,
      address: "Krishi Mandi Parisar, Jabalpur",
      district: "Jabalpur",
      state: "Madhya Pradesh",
      pincode: "482002",
      contactPhone: "+91-761-2601133",
      capacityPerDayQuintals: 750.0,
      currentLoadQuintals: 0.0, // 0% (GREY - Maintenance)
      processingSpeedPerHour: 60.0,
      operatingHours: "08:30 AM - 05:00 PM",
      activeCounters: 0,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 0,
      moistureMetersTotal: 2,
      moistureMetersActive: 0,
      status: "MAINTENANCE" as const,
    },
    {
      name: "Meerut Kisan Mandi",
      code: "PC-UP-001",
      latitude: 28.9845,
      longitude: 77.7064,
      address: "Delhi Road, Transport Nagar, Meerut",
      district: "Meerut",
      state: "Uttar Pradesh",
      pincode: "250002",
      contactPhone: "+91-121-2510200",
      capacityPerDayQuintals: 1400.0,
      currentLoadQuintals: 812.0, // 58% (GREEN)
      processingSpeedPerHour: 130.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 4,
      weighingMachinesTotal: 3,
      weighingMachinesActive: 3,
      moistureMetersTotal: 3,
      moistureMetersActive: 3,
      status: "ACTIVE" as const,
    },
    {
      name: "Rajkot APMC Market",
      code: "PC-GJ-001",
      latitude: 22.3039,
      longitude: 70.8022,
      address: "Bedi Mandi Yard, Rajkot",
      district: "Rajkot",
      state: "Gujarat",
      pincode: "360003",
      contactPhone: "+91-281-2470120",
      capacityPerDayQuintals: 1500.0,
      currentLoadQuintals: 930.0, // 62% (YELLOW)
      processingSpeedPerHour: 125.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 4,
      weighingMachinesTotal: 3,
      weighingMachinesActive: 3,
      moistureMetersTotal: 3,
      moistureMetersActive: 3,
      status: "ACTIVE" as const,
    },
    {
      name: "Cuttack Central RMC Krishi Mandi",
      code: "PC-OD-001",
      latitude: 20.4625,
      longitude: 85.8830,
      address: "Malgodown APMC Market Yard, Badambadi, Cuttack",
      district: "Cuttack",
      state: "Odisha",
      pincode: "753003",
      contactPhone: "+91-671-2321400",
      capacityPerDayQuintals: 1200.0,
      currentLoadQuintals: 380.0, // 31% Low (GREEN)
      processingSpeedPerHour: 110.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 4,
      weighingMachinesTotal: 3,
      weighingMachinesActive: 3,
      moistureMetersTotal: 3,
      moistureMetersActive: 3,
      status: "ACTIVE" as const,
    },
    {
      name: "Salipur Cooperative PACS Centre",
      code: "PC-OD-002",
      latitude: 20.4897,
      longitude: 85.9961,
      address: "Kendrapara Road, Salipur Sub-Mandi, Cuttack",
      district: "Cuttack",
      state: "Odisha",
      pincode: "754202",
      contactPhone: "+91-671-2856200",
      capacityPerDayQuintals: 750.0,
      currentLoadQuintals: 180.0, // 24% Low (GREEN)
      processingSpeedPerHour: 80.0,
      operatingHours: "08:00 AM - 05:30 PM",
      activeCounters: 3,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "ACTIVE" as const,
    },
    {
      name: "Bhubaneswar Regional Krishi Mandi (RMC)",
      code: "PC-OD-003",
      latitude: 20.2961,
      longitude: 85.8245,
      address: "Rasulgarh Terminal Yard, Cuttack-Puri Road, Bhubaneswar",
      district: "Khordha",
      state: "Odisha",
      pincode: "751010",
      contactPhone: "+91-674-2580100",
      capacityPerDayQuintals: 1500.0,
      currentLoadQuintals: 600.0, // 40% (GREEN)
      processingSpeedPerHour: 130.0,
      operatingHours: "07:30 AM - 06:30 PM",
      activeCounters: 5,
      weighingMachinesTotal: 3,
      weighingMachinesActive: 3,
      moistureMetersTotal: 3,
      moistureMetersActive: 3,
      status: "ACTIVE" as const,
    },
    {
      name: "Banki Cooperative PACS Sub-Centre",
      code: "PC-OD-004",
      latitude: 20.3795,
      longitude: 85.5318,
      address: "Main APMC Sub-Yard, Banki, Cuttack",
      district: "Cuttack",
      state: "Odisha",
      pincode: "754008",
      contactPhone: "+91-671-2872300",
      capacityPerDayQuintals: 650.0,
      currentLoadQuintals: 200.0, // 30% (GREEN)
      processingSpeedPerHour: 70.0,
      operatingHours: "08:30 AM - 05:00 PM",
      activeCounters: 2,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "ACTIVE" as const,
    },
    {
      name: "Khordha Jatani RMC Procurement Centre",
      code: "PC-OD-005",
      latitude: 20.1585,
      longitude: 85.7061,
      address: "RMC Mandi Yard, Station Road, Jatani, Khordha",
      district: "Khordha",
      state: "Odisha",
      pincode: "752050",
      contactPhone: "+91-674-2490200",
      capacityPerDayQuintals: 1100.0,
      currentLoadQuintals: 385.0, // 35% (GREEN)
      processingSpeedPerHour: 95.0,
      operatingHours: "08:00 AM - 06:00 PM",
      activeCounters: 3,
      weighingMachinesTotal: 2,
      weighingMachinesActive: 2,
      moistureMetersTotal: 2,
      moistureMetersActive: 2,
      status: "ACTIVE" as const,
    },
    {
      name: "Bargarh Main Paddy Procurement Mandi",
      code: "PC-OD-006",
      latitude: 21.3324,
      longitude: 83.6198,
      address: "RMC Mandi Yard, Canal Road, Bargarh",
      district: "Bargarh",
      state: "Odisha",
      pincode: "768028",
      contactPhone: "+91-6646-234500",
      capacityPerDayQuintals: 2200.0,
      currentLoadQuintals: 990.0, // 45% (GREEN)
      processingSpeedPerHour: 150.0,
      operatingHours: "07:00 AM - 07:00 PM",
      activeCounters: 5,
      weighingMachinesTotal: 4,
      weighingMachinesActive: 4,
      moistureMetersTotal: 4,
      moistureMetersActive: 4,
      status: "ACTIVE" as const,
    },
  ];

  const createdCentres: Record<string, any> = {};
  for (const c of centresData) {
    const centreRecord = await prisma.procurementCentre.create({ data: c });
    createdCentres[c.code] = centreRecord;

    // Link supported crops to this centre
    for (const cropName of Object.keys(createdCrops)) {
      await prisma.centreCrop.create({
        data: {
          centreId: centreRecord.id,
          cropId: createdCrops[cropName].id,
          dailyQuotaQuintals: c.capacityPerDayQuintals * 0.4,
          procuredTodayQuintals: 0,
          available: c.status !== "MAINTENANCE",
        },
      });
    }
  }

  // 5. Seed Slots for Centres for Today and Tomorrow
  console.log("â° Seeding hourly procurement slots for centres...");
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const timeSlots = [
    { start: "08:00", end: "10:00" },
    { start: "10:00", end: "12:00" },
    { start: "12:00", end: "14:00" },
    { start: "14:00", end: "16:00" },
    { start: "16:00", end: "18:00" },
  ];

  const createdSlots: any[] = [];
  for (const centreCode of ["PC-HR-001", "PC-HR-002", "PC-PB-001", "PC-MP-001"]) {
    const centre = createdCentres[centreCode];
    for (const d of [todayStr, tomorrowStr]) {
      for (const slot of timeSlots) {
        const slotRec = await prisma.slot.create({
          data: {
            centreId: centre.id,
            date: d,
            startTime: slot.start,
            endTime: slot.end,
            maxCapacityQuintals: centre.capacityPerDayQuintals / 5,
            bookedCapacityQuintals: 40.0,
            status: "AVAILABLE",
          },
        });
        createdSlots.push(slotRec);
      }
    }
  }

  // 6. Seed System Role Users (Operator, Inspector, Admin)
  // FARMER accounts are NOT pre-seeded â€” farmers register via OTP + KYC
  console.log("ðŸ‘¥ Seeding system role accounts (Operator, Inspector, Admin)...");

  // 6.1 Centre Operator Demo Account
  const operatorUser = await prisma.user.upsert({
    where: { phone: "9876543220" },
    update: { name: "Suraj Meena", role: "CENTRE_OPERATOR" },
    create: {
      phone: "9876543220",
      name: "Suraj Meena",
      role: "CENTRE_OPERATOR",
      language: "en",
    },
  });

  // Assign operator to Karnal Central APMC Mandi
  const karnalCentre = createdCentres["PC-HR-001"];
  if (karnalCentre) {
    await prisma.procurementCentre.update({
      where: { id: karnalCentre.id },
      data: { operators: { connect: { id: operatorUser.id } } },
    });
  }

  // 6.2 Quality Inspector Demo Account
  await prisma.user.upsert({
    where: { phone: "9876543230" },
    update: { name: "Dr. Anil Sharma", role: "QUALITY_INSPECTOR" },
    create: {
      phone: "9876543230",
      name: "Dr. Anil Sharma",
      role: "QUALITY_INSPECTOR",
      language: "en",
    },
  });

  // 6.3 District Admin Demo Account
  await prisma.user.upsert({
    where: { phone: "9876543240" },
    update: { name: "Vikas Verma", role: "DISTRICT_ADMIN" },
    create: {
      phone: "9876543240",
      name: "Vikas Verma",
      role: "DISTRICT_ADMIN",
      language: "en",
    },
  });

  // 6.4 State Admin Demo Account
  await prisma.user.upsert({
    where: { phone: "9876543250" },
    update: { name: "Meenakshi Sundaram", role: "STATE_ADMIN" },
    create: {
      phone: "9876543250",
      name: "Meenakshi Sundaram",
      role: "STATE_ADMIN",
      language: "en",
    },
  });

  // 6.5 Super Admin Demo Account
  await prisma.user.upsert({
    where: { phone: "9876543260" },
    update: { name: "Rajeshwari Singh", role: "SUPER_ADMIN" },
    create: {
      phone: "9876543260",
      name: "Rajeshwari Singh",
      role: "SUPER_ADMIN",
      language: "en",
    },
  });

  console.log("âœ… [KRISHI SETU] Real-Data Database Seed Complete!");
  console.log("   - 25 Verified GovRegistry Farmers (for Aadhaar/KisanID validation)");
  console.log("   - 12 Procurement Centres across 7 States with real coordinates");
  console.log("   - 4 Major Crops (Wheat, Paddy, Maize, Soybean) with 2026 MSP Rates");
  console.log("   - Slots seeded for today and tomorrow at 4 key centres");
  console.log("   - 5 System Role Accounts (OPERATOR, INSPECTOR, DISTRICT_ADMIN, STATE_ADMIN, SUPER_ADMIN)");
  console.log("");
  console.log("   ðŸ‘¨â€ðŸŒ¾ FARMERS: Must register via OTP + Aadhaar/KisanID verification");
  console.log("   ðŸ“‹ GovRegistry contains 25 farmer records for validation:");
  console.log("      â†’ Aadhaar: 123456789012 | KisanID: KID-MH-2026-001 (Rameshwar Patil, Nagpur)");
  console.log("      â†’ Aadhaar: 234567890123 | KisanID: KID-HR-2024-8892 (Suresh Patel, Karnal)");
  console.log("      â†’ Aadhaar: 345678901234 | KisanID: KID-PB-2024-1101 (Harpreet Kaur, Ludhiana)");
  console.log("   ðŸ“± System role OTP: Use the demo buttons on the login page");
}

main()
  .catch((e) => {
    console.error('Seed Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
