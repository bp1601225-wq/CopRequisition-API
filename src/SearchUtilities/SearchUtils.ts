import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js"

dayjs.extend(isoWeek);

export const FetchUtils = {
  FetchRequiation_By_Date_Range_OR_Requester(
    search?: string
  ): Prisma.RequisitionWhereInput {
    if (!search?.trim()) return {};

    const term = search.trim();

    return {
      OR: [
        {
          requisitionNo: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          createdBy: {
            is: {
              firstname: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        },
        {
          createdBy: {
            is: {
              lastname: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        },
        {
          createdBy: {
            is: {
              email: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        },
        {
          createdBy: {
            is: {
              phone: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    };
  },

  // Filter requisitions by date range.
  FetchDateRange(
    dateRange?: string
  ): Prisma.RequisitionWhereInput {
    if (!dateRange) return {};

    const today = dayjs();

    let startDate;
    let endDate;

    switch (dateRange) {
      case "TODAY":
        startDate = today.startOf("day");
        endDate = today.endOf("day");
        break;

      case "YESTERDAY":
        startDate = today.subtract(1, "day").startOf("day");
        endDate = today.subtract(1, "day").endOf("day");
        break;

      case "LAST_7_DAYS":
        startDate = today.subtract(6, "day").startOf("day");
        endDate = today.endOf("day");
        break;

      case "LAST_30_DAYS":
        startDate = today.subtract(29, "day").startOf("day");
        endDate = today.endOf("day");
        break;

      // ISO week runs from Monday to Sunday.
      case "THIS_WEEK":
        startDate = today.startOf("isoWeek");
        endDate = today.endOf("isoWeek");
        break;

      case "LAST_WEEK":
        startDate = today.subtract(1, "week").startOf("isoWeek");
        endDate = today.subtract(1, "week").endOf("isoWeek");
        break;

      case "THIS_MONTH":
        startDate = today.startOf("month");
        endDate = today.endOf("month");
        break;

      case "LAST_MONTH":
        startDate = today.subtract(1, "month").startOf("month");
        endDate = today.subtract(1, "month").endOf("month");
        break;

      case "THIS_YEAR":
        startDate = today.startOf("year");
        endDate = today.endOf("year");
        break;

      default:
        return {};
    }

    return {
      date: {
        gte: startDate.toDate(),
        lte: endDate.toDate(),
      },
    };
  },
};