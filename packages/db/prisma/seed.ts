import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateInviteCode } from "@housing-app/shared";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

// Mirrors what the /api/auth/signup route does when someone signs up through
// a personal invite link: the inviter is recorded as provenance, and the two
// are auto-connected (ACCEPTED, no request/accept step) since handing someone
// your invite link is you vouching for them into the graph directly.
async function upsertUser(name: string, email: string, bio: string, city: string, invitedById?: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, bio, city, inviteCode: generateInviteCode(), invitedById },
  });

  if (invitedById) {
    await prisma.connectionRequest.upsert({
      where: { userAId_userBId: { userAId: invitedById, userBId: user.id } },
      update: { status: "ACCEPTED", respondedAt: new Date() },
      create: { userAId: invitedById, userBId: user.id, status: "ACCEPTED", respondedAt: new Date() },
    });
  }

  return user;
}

async function main() {
  // The "connector" — a well-connected person (like you) who knows everyone
  // below but whose friends mostly don't know each other. Signed up
  // organically (no inviter).
  const nathyn = await upsertUser(
    "Nathyn",
    "nathyn@example.com",
    "Knows way too many people looking for apartments in NYC.",
    "New York, NY",
  );

  // Three friends who joined through Nathyn's personal invite link and only
  // know Nathyn, not each other — the scenario from the pitch: all looking
  // for a place, all desperate, all reachable only through one connector.
  const alice = await upsertUser(
    "Alice",
    "alice@example.com",
    "Needs a room ASAP, flexible on everything else.",
    "New York, NY",
    nathyn.id,
  );
  const bob = await upsertUser("Bob", "bob@example.com", "Looking to split a 2BR, easygoing.", "New York, NY", nathyn.id);
  const cara = await upsertUser(
    "Cara",
    "cara@example.com",
    "Open to almost any setup, just needs to move soon.",
    "New York, NY",
    nathyn.id,
  );

  // A friend-of-a-friend with a room to offer, also invited by Nathyn, two
  // hops from Alice/Bob/Cara, to demonstrate the degree-of-separation cutoff.
  const dana = await upsertUser(
    "Dana",
    "dana@example.com",
    "Has an extra room in a 3BR in Brooklyn.",
    "New York, NY",
    nathyn.id,
  );

  // Unconnected strangers with matching stats on paper, to prove the graph
  // filter — not the raw compatibility score — is what keeps them hidden.
  const erin = await upsertUser("Erin", "erin@example.com", "Stranger, not in the network.", "New York, NY");
  const frank = await upsertUser("Frank", "frank@example.com", "Another stranger, not in the network.", "New York, NY");

  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in45Days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  await prisma.housingNeed.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      city: "New York, NY",
      neighborhoods: "Astoria, Bushwick, Williamsburg",
      budgetMin: 1200,
      budgetMax: 1800,
      moveInDate: in30Days,
      urgency: "URGENT",
      roomType: "ANY",
      amenities: "in-unit laundry, pet friendly",
      notes: "Very flexible, just need to move fast.",
      visibility: 3,
    },
  });

  await prisma.housingNeed.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      city: "New York, NY",
      neighborhoods: "Bushwick, Ridgewood",
      budgetMin: 1300,
      budgetMax: 1900,
      moveInDate: in45Days,
      urgency: "SOON",
      roomType: "SHARED_ROOM",
      amenities: "in-unit laundry",
      notes: "Easygoing, works nights.",
      visibility: 2,
    },
  });

  await prisma.housingNeed.upsert({
    where: { userId: cara.id },
    update: {},
    create: {
      userId: cara.id,
      city: "New York, NY",
      neighborhoods: "Williamsburg, Bushwick, Greenpoint",
      budgetMin: 1250,
      budgetMax: 2000,
      moveInDate: in30Days,
      urgency: "URGENT",
      roomType: "ANY",
      notes: "Open to almost any option.",
      visibility: 3,
    },
  });

  await prisma.housingOffer.upsert({
    where: { userId: dana.id },
    update: {},
    create: {
      userId: dana.id,
      city: "New York, NY",
      neighborhood: "Bushwick, Brooklyn",
      rentAmount: 1450,
      availableDate: in60Days,
      roomType: "PRIVATE_ROOM",
      amenities: "in-unit laundry, rooftop access",
      description: "Extra room in a 3BR, current roommates are chill.",
      visibility: 3,
    },
  });

  await prisma.housingNeed.upsert({
    where: { userId: erin.id },
    update: {},
    create: {
      userId: erin.id,
      city: "New York, NY",
      budgetMin: 1200,
      budgetMax: 1800,
      moveInDate: in30Days,
      urgency: "URGENT",
      roomType: "ANY",
      visibility: 2,
    },
  });

  await prisma.housingNeed.upsert({
    where: { userId: frank.id },
    update: {},
    create: {
      userId: frank.id,
      city: "New York, NY",
      budgetMin: 1250,
      budgetMax: 1900,
      moveInDate: in30Days,
      urgency: "SOON",
      roomType: "ANY",
      visibility: 2,
    },
  });

  // Alice and Cara share a near-identical lifestyle (tidy, home a lot, keep
  // to themselves) despite never having met — while Bob's logistics overlap
  // reasonably with theirs but his lifestyle is the opposite on every axis.
  // The point: a grid that shows lifestyle compatibility alongside budget/
  // timing surfaces that mismatch instead of hiding it behind one score.
  await prisma.lifestyleProfile.upsert({
    where: { userId: alice.id },
    update: {},
    create: { userId: alice.id, cleanliness: 4, timeAtHome: "OFTEN", hostingGuests: "RARELY", socialStyle: "INTROVERT" },
  });
  await prisma.lifestyleProfile.upsert({
    where: { userId: cara.id },
    update: {},
    create: { userId: cara.id, cleanliness: 4, timeAtHome: "OFTEN", hostingGuests: "RARELY", socialStyle: "INTROVERT" },
  });
  await prisma.lifestyleProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: { userId: bob.id, cleanliness: 2, timeAtHome: "RARELY", hostingGuests: "OFTEN", socialStyle: "EXTROVERT" },
  });
  await prisma.lifestyleProfile.upsert({
    where: { userId: dana.id },
    update: {},
    create: { userId: dana.id, cleanliness: 5, timeAtHome: "SOMETIMES", hostingGuests: "SOMETIMES", socialStyle: "AMBIVERT" },
  });

  await prisma.vouch.upsert({
    where: { voucherId_targetId: { voucherId: nathyn.id, targetId: alice.id } },
    update: {},
    create: { voucherId: nathyn.id, targetId: alice.id, note: "Known her for years, super clean and reliable." },
  });
  await prisma.vouch.upsert({
    where: { voucherId_targetId: { voucherId: nathyn.id, targetId: bob.id } },
    update: {},
    create: { voucherId: nathyn.id, targetId: bob.id, note: "Solid guy, always pays on time." },
  });

  console.log("Seeded demo network. All accounts use password:", DEMO_PASSWORD);
  console.log("Try logging in as alice@example.com, bob@example.com, or cara@example.com.");
  console.log(`Nathyn's invite link: /invite/${nathyn.inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
