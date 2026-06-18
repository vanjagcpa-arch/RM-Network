import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  suburb: varchar("suburb", { length: 100 }),
  postcode: varchar("postcode", { length: 10 }),
  state: varchar("state", { length: 10 }),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const technicians = pgTable("technicians", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  specialties: text("specialties"),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobTypeCategories = [
  "smoke_alarm",
  "test_and_tag",
  "electrical",
  "gas_appliance",
  "maintenance",
] as const;

export type JobTypeCategory = (typeof jobTypeCategories)[number];

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  technicianId: uuid("technician_id").references(() => technicians.id),
  jobCategory: varchar("job_category", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  scheduledDate: varchar("scheduled_date", { length: 10 }),
  scheduledTimeStart: varchar("scheduled_time_start", { length: 10 }),
  scheduledTimeEnd: varchar("scheduled_time_end", { length: 10 }),
  tenantName: varchar("tenant_name", { length: 255 }),
  tenantEmail: varchar("tenant_email", { length: 255 }),
  tenantPhone: varchar("tenant_phone", { length: 20 }),
  unitNumber: varchar("unit_number", { length: 20 }),
  notes: text("notes"),
  ascoraJobId: varchar("ascora_job_id", { length: 50 }),
  ascoraExportedAt: timestamp("ascora_exported_at"),
  bookingLinkId: uuid("booking_link_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookingLinks = pgTable("booking_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  jobCategory: varchar("job_category", { length: 50 }),
  label: varchar("label", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  maxBookings: integer("max_bookings").default(0),
  currentBookings: integer("current_bookings").notNull().default(0),
  allowedWeekdays: text("allowed_weekdays"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type BookingLink = typeof bookingLinks.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type NewProperty = typeof properties.$inferInsert;
export type NewTechnician = typeof technicians.$inferInsert;
export type NewBookingLink = typeof bookingLinks.$inferInsert;
