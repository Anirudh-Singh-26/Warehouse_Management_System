function singular(page) {
  return (
    {
      products: "product",
      suppliers: "supplier",
      "transport-providers": "partner",
      vehicles: "vehicle",
      drivers: "driver",
      workers: "worker",
      "staffing-agencies": "staffing agency",
      attendance: "attendance record",
      tasks: "task",
      "bonus-records": "bonus record",
      expenses: "expense",
      shipments: "shipment",
    }[page] || "record"
  );
}
export { singular };
