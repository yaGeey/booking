export function getTime(date: Date | string) {
   const d = new Date(date);
   return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
   });
}