import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { JobListings } from "../entities/job-listing";
import { JobItem } from "../entities/job-item";

// ---------- Zod Schemas ----------
const createSchema = z.object({
  jobTaskId: z.number().int().positive(),
  details: z.string().min(3).max(5000).optional(),
  // budget_amount: z.number().nonnegative().optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  scheduled_date: z.iso.date().optional(),
  scheduled_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) // HH:mm or HH:mm:ss
    .optional(),
});

const jobListQuerySchem = z.object({
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(10),
  status: z.string(),
  sort: z.enum(["newest", "oldest"]).default("newest"),



})

function toDateOrNull(s?: string) {
  return s ? new Date(s) : null;
}

export const customerController = {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const body = createSchema.parse(req.body);

      const jobItemRepo = AppDataSource.getRepository(JobItem);
      const item = await jobItemRepo.findOne({
        where: { id: body.jobTaskId },
        relations: { parent: true },
      });
      if (!item) return res.status(400).json({ message: "Invalid jobTaskId" });

      if (item.kind !== "sub-category") {
        return res.status(400).json({ message: "jobTaskId must reference a sub-category (task)" });
      }
      if (!item.parent) {
        return res.status(400).json({ message: "Selected task has no parent category" });
      }

if (!item.parent || !["sub-category"].includes(item.kind)) {
  return res.status(400).json({ message: "jobTaskId must reference a sub-category (task)" });
}


      const listingRepo = AppDataSource.getRepository(JobListings);
      const listing = listingRepo.create({
        user: { id: userId } as any,
        job_item: item,
        details: body.details ?? null,
        city: body.city ?? null,
        pincode: body.pincode ?? null,
        scheduled_date: body.scheduled_date ?? null, // Date | null
  scheduled_time: body.scheduled_time ?? null, // string | null
        status: "open",
      });
      await listingRepo.save(listing);

      return res.status(201).json({
        message: "Job created",
        data: {
          id: listing.id,
          status: listing.status,
          jobTask: { id: item.id, name: item.name, categoryId: item.parent.id, categoryName: item.parent.name },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async viewJob(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as number | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorised" });

    const { page, pageSize, status, sort } = jobListQuerySchem.parse(req.query);

    const repo = AppDataSource.getRepository(JobListings);

    const qb = repo
      .createQueryBuilder("job")
      .leftJoinAndSelect("job.job_item", "job_item")
      .leftJoinAndSelect("job_item.parent", "parent")
      .leftJoinAndSelect("job.bids", "bid")          // <- include bids
      .leftJoinAndSelect("bid.vendor", "vendor")     // <- include vendor on each bid
      .where("job.userId = :userId", { userId });

    if (status) qb.andWhere("job.status = :status", { status });

    qb.orderBy("job.id", sort === "newest" ? "DESC" : "ASC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    // shape the response
    const data = rows.map((j) => ({
      id: j.id,
      status: j.status,
      details: j.details,
      city: j.city,
      pincode: j.pincode,
      jobTask: {
        id: j.job_item?.id,
        name: j.job_item?.name,
        categoryId: j.job_item?.parent?.id,
        categoryName: j.job_item?.parent?.name,
      },
      bids: (j as any).bids?.map((b: any) => ({
        id: b.id,
        amount: b.amount,
        status: b.status,
        // adjust these vendor fields to match your Vendor entity
        vendor: b.vendor
          ? {
              id: b.vendor.id,
              name: b.vendor.name ?? b.vendor.full_name ?? b.vendor.business_name ?? null,
              phone: b.vendor.phone ?? null,
              email: b.vendor.email ?? null,
            }
          : null,
        message: b.message ?? null,
        createdAt: b.created_at ?? undefined, // keep if you have timestamps
      })) ?? [],
    }));

    return res.json({
      message: "OK",
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      data,
    });
  } catch (err) {
    next(err);
  }
}
,
};