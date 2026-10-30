import dayjs from "dayjs";


export const GenerateReportService = {

Comprehensive(data:any){


    // dayjs(dateString, format, strict);


// - dateString – the date you want to parse.
// - format – the expected date format.
// - strict – true means the date must match the format exactly.
   

const startDate = data.startDate
    const endDate = data.endDate



    const start = dayjs(startDate, "YYYY-MM-DD", true);
const end = dayjs(endDate, "YYYY-MM-DD", true);

if (!start.isValid() || !end.isValid()) {
  throw new Error("Invalid date. Use YYYY-MM-DD");
}

if (end.isBefore(start, "day")) {
  throw new Error("End date cannot be before start date");
}
},

Custom(){

}

}