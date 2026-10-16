import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Command,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  X,
  RefreshCw,
  CircleHelp,
  Download,
  KeyRound,
  UserRound,
} from "../icons.js";
import { useNavigate } from "react-router-dom";
import { api, unwrapList, money, dateText } from "../lib/api.js";
import { fields, resourcePath } from "../config/resources.js";
import { pageTitles as titles } from "../config/navigation.js";
import { singular } from "../lib/labels.js";
import { exportCSV } from "../lib/csv.js";
import { pretty, cellValue } from "../lib/formatters.jsx";
function ResourcePage({ page, search, setSearch, notify, user }) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [showCreate, setShowCreate] = useState(false),
    [saving, setSaving] = useState(false),
    [form, setForm] = useState({}),
    [statusFilter, setStatusFilter] = useState(""),
    [operation, setOperation] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [shipmentStatusTarget, setShipmentStatusTarget] = useState(null);
  const [shipmentStatusForm, setShipmentStatusForm] = useState({
    status: "",
    location: "",
    notes: "",
  });

  const navigate = useNavigate();

  const createRoles = {
    products: ["ADMIN", "INVENTORY_MANAGER"],
    suppliers: ["ADMIN", "INVENTORY_MANAGER", "RECEIVING_STAFF"],
    shipments: ["ADMIN", "DISPATCH_STAFF", "TRANSPORT_COORDINATOR"],
    "transport-providers": ["ADMIN", "TRANSPORT_COORDINATOR"],
    vehicles: ["ADMIN", "TRANSPORT_COORDINATOR"],
    drivers: ["ADMIN", "TRANSPORT_COORDINATOR"],
    workers: ["ADMIN", "HR_MANAGER"],
    "staffing-agencies": ["ADMIN", "HR_MANAGER"],
    attendance: ["ADMIN", "HR_MANAGER"],
    tasks: ["ADMIN", "HR_MANAGER"],
    "bonus-records": ["ADMIN", "HR_MANAGER"],
  };

  const canCreate = !!fields[page] && createRoles[page]?.includes(user?.role);

  const config = fields[page] || [];
  const path = resourcePath(page);

  function openDetails(item) {
    const id = item?._id || item?.id;
    if (!id) {
      notify?.("This record does not have an ID, so its details page cannot be opened.");
      return;
    }
    navigate(`/records/${page}/${encodeURIComponent(id)}`);
  }

  async function loadProducts() {
    setProductsLoading(true);

    try {
      const response = await api("/products");
      const productList = unwrapList(response);

      setProducts(
        productList.filter(
          (product) => product?._id && product.status === "ACTIVE",
        ),
      );
    } catch (e) {
      setError(`Unable to load products: ${e.message}`);
    } finally {
      setProductsLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (statusFilter) query.set("status", statusFilter);
      const d = await api(`${path}${query.size ? "?" + query : ""}`);
      setItems(unwrapList(d));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [page, search, statusFilter]);
  useEffect(() => {
    const fn = () => {
      setForm({});
      setShowCreate(true);
    };
    window.addEventListener("open-create", fn);
    return () => window.removeEventListener("open-create", fn);
  }, []);
  const cols = useMemo(() => {
    if (items.length) {
      const preferred =
        page === "products"
          ? [
              "sku",
              "name",
              "category",
              "quantityOnHand",
              "costPrice",
              "sellingPrice",
              "status",
            ]
          : page === "shipments"
            ? [
                "shipmentCode",
                "orderReference",
                "customerName",
                "quantity",
                "trackingNumber",
                "status",
              ]
            : page === "inventory"
              ? [
                  "product",
                  "productId",
                  "quantityOnHand",
                  "availableQuantity",
                  "quantityDamaged",
                  "updatedAt",
                ]
              : page === "movements"
                ? [
                    "movementType",
                    "type",
                    "productId",
                    "quantity",
                    "reference",
                    "reason",
                    "createdAt",
                  ]
                : [
                    "workerCode",
                    "code",
                    "name",
                    "title",
                    "registrationNumber",
                    "date",
                    "status",
                    "priority",
                    "amount",
                    "approved",
                    "createdAt",
                  ];
      const all = Object.keys(items[0]).filter(
        (k) =>
          ![
            "_id",
            "__v",
            "updatedAt",
            "createdBy",
            "updatedBy",
            "recordedBy",
            "metadata",
            "notes",
            "description",
          ].includes(k),
      );
      const chosen = preferred.filter((k) => all.includes(k));
      return [...chosen, ...all.filter((k) => !chosen.includes(k))].slice(0, 6);
    }
    return page === "products"
      ? ["sku", "name", "category", "costPrice", "sellingPrice", "status"]
      : page === "inventory"
        ? ["productId", "quantityOnHand", "quantityDamaged", "updatedAt"]
        : page === "movements"
          ? ["movementType", "productId", "quantity", "reference", "createdAt"]
          : page === "shipments"
            ? [
                "shipmentCode",
                "orderReference",
                "customerName",
                "quantity",
                "status",
              ]
            : ["code", "name", "status", "createdAt"];
  }, [items, page]);
  async function submitOperation(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (operation === "receipts") {
        payload.acceptedQuantity = Number(payload.acceptedQuantity || 0);
        payload.damagedQuantity = Number(payload.damagedQuantity || 0);
        await api("/inventory/receipts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (operation === "dispatches") {
        payload.quantity = Number(payload.quantity);
        await api("/inventory/dispatches", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (operation === "damaged-disposition") {
        payload.quantity = Number(payload.quantity);
        payload.action = payload.action || "RELEASE";
        await api("/inventory/damaged-stock/disposition", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        payload.quantityDelta = Number(payload.quantityDelta);
        await api("/inventory/adjustments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setOperation("");
      setForm({});
      notify(
        operation === "receipts"
          ? "Stock receipt recorded"
          : operation === "dispatches"
            ? "Stock dispatch recorded"
            : operation === "damaged-disposition"
              ? "Damaged stock disposition recorded"
              : "Stock adjustment recorded",
      );
      load();
    } catch (e) {
      setError(e.message || "The inventory transaction failed.");
    } finally {
      setSaving(false);
    }
  }
  async function workflowAction(item, action) {
    setSaving(true);
    setError("");
    try {
      if (page === "tasks") {
        await api(`/tasks/${item._id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: action }),
        });
        notify(`Task moved to ${action.replaceAll("_", " ").toLowerCase()}`);
      } else {
        const approvalNote = window.prompt("Optional approval note:", "") || "";
        await api(`/bonus-records/${item._id}/approval`, {
          method: "PATCH",
          body: JSON.stringify({ decision: action, approvalNote }),
        });
        notify(`Bonus ${action.toLowerCase()}`);
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  const shipmentTransitions = {
    DRAFT: ["READY", "CANCELLED"],
    READY: ["DISPATCHED", "CANCELLED"],
    DISPATCHED: ["IN_TRANSIT", "DELIVERED", "FAILED"],
    IN_TRANSIT: ["DELIVERED", "FAILED"],
    FAILED: ["RETURNED"],
    DELIVERED: [],
    RETURNED: [],
    CANCELLED: [],
  };

  function openShipmentStatus(item) {
    const nextStatuses = shipmentTransitions[item.status] || [];
    setShipmentStatusTarget(item);
    setShipmentStatusForm({
      status: nextStatuses[0] || "",
      location: "",
      notes: "",
    });
    setError("");
  }

  async function updateShipmentStatus(e) {
    e.preventDefault();
    if (!shipmentStatusTarget || !shipmentStatusForm.status) return;
    setSaving(true);
    setError("");
    try {
      await api(`/shipments/${shipmentStatusTarget._id}/status`, {
        method: "PATCH",
        body: JSON.stringify(shipmentStatusForm),
      });
      notify(`Shipment ${shipmentStatusTarget.shipmentCode} updated to ${shipmentStatusForm.status.replaceAll("_", " ").toLowerCase()}`);
      setShipmentStatusTarget(null);
      setShipmentStatusForm({ status: "", location: "", notes: "" });
      await load();
    } catch (e) {
      setError(e.message || "Could not update shipment tracking.");
    } finally {
      setSaving(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      for (const [key, val] of Object.entries(payload)) {
        const field = config.find((f) => f[0] === key);
        if (field?.[2] === "number")
          payload[key] = val === "" ? 0 : Number(val);
        if (field?.[2] === "select" && ["eligible"].includes(key))
          payload[key] = val === "true";
        if (field?.[2] === "datetime-local" && val)
          payload[key] = new Date(val).toISOString();
        if (field?.[2] === "date" && val)
          payload[key] = new Date(`${val}T00:00:00`).toISOString();
        if (val === "") delete payload[key];
      }
      await api(path, { method: "POST", body: JSON.stringify(payload) });
      setShowCreate(false);
      setForm({});
      notify(`${singular(page)} created successfully`);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${titles[page]?.toLowerCase() || "records"}…`}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="toolbar-right inventory-toolbar-actions">
          {page === "inventory" && (
            <>
              {["ADMIN", "INVENTORY_MANAGER"].includes(user?.role) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setForm({});
                    setOperation("adjustments");
                    loadProducts();
                  }}
                >
                  Adjust stock
                </button>
              )}

              {["ADMIN", "DISPATCH_STAFF"].includes(user?.role) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setForm({});
                    setOperation("dispatches");
                  }}
                >
                  Dispatch
                </button>
              )}

              {["ADMIN", "INVENTORY_MANAGER"].includes(user?.role) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setForm({});
                    setOperation("damaged-disposition");
                  }}
                >
                  Inspect damaged
                </button>
              )}

              {["ADMIN", "INVENTORY_MANAGER", "RECEIVING_STAFF"].includes(
                user?.role,
              ) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setForm({});
                    setOperation("receipts");
                  }}
                >
                  Receive stock
                </button>
              )}
            </>
          )}

          {[
            "products",
            "suppliers",
            "transport-providers",
            "vehicles",
            "drivers",
            "workers",
            "tasks",
            "shipments",
          ].includes(page) && (
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {(page === "vehicles"
                ? ["AVAILABLE", "IN_USE", "MAINTENANCE", "INACTIVE"]
                : page === "drivers"
                  ? ["AVAILABLE", "ASSIGNED", "INACTIVE"]
                  : ["ACTIVE", "INACTIVE"]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}

          {[
            "ADMIN",
            "INVENTORY_MANAGER",
            "HR_MANAGER",
            "FINANCE_MANAGER",
          ].includes(user?.role) && (
            <button
              className="secondary-btn"
              onClick={() => exportCSV(items, `${page}-export.csv`)}
              disabled={!items.length}
            >
              <Download size={15} /> Export CSV
            </button>
          )}

          <button className="secondary-btn" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>
      {error && (
        <div className="notice warning">
          <AlertTriangle size={17} />
          <div>
            <b>Couldn't load this section</b>
            <span>
              {error}. Confirm your role has permission to view this resource.
            </span>
          </div>
          <button className="icon-btn" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="panel table-panel">
        <div className="table-panel-head">
          <div>
            <h3>{titles[page]}</h3>
            <p>
              {loading
                ? "Loading records…"
                : `${items.length} record${items.length === 1 ? "" : "s"} on this page`}
            </p>
          </div>
          <span className="section-chip">
            <Activity size={14} /> Live data
          </span>
        </div>
        {loading ? (
          <div className="table-empty">
            <div className="spinner" />
            <b>Loading records</b>
            <span>Fetching data from your backend…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">
              <Package size={23} />
            </div>
            <b>{search ? "No matching records" : "Nothing here yet"}</b>
            <span>
              {search
                ? "Try another search term or clear the search."
                : "Records will appear here once they are added to the system."}
            </span>
            {canCreate && (
              <button
                className="primary-btn"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={16} /> Add {singular(page)}
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{pretty(c)}</th>
                  ))}
                  <th>Details</th>
                  {["tasks", "bonus-records"].includes(page) && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id || item.id || i}>
                    {cols.map((c) => (
                      <td key={c}>{cellValue(item[c], c)}</td>
                    ))}
                    <td>
                      <div className="toolbar-right inventory-toolbar-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => openDetails(item)}
                        >
                          View
                        </button>
                        {page === "shipments" &&
                          [
                            "ADMIN",
                            "INVENTORY_MANAGER",
                            "DISPATCH_STAFF",
                            "TRANSPORT_COORDINATOR",
                          ].includes(user?.role) &&
                          (shipmentTransitions[item.status] || []).length >
                            0 && (
                            <button
                              type="button"
                              className="secondary-btn"
                              disabled={saving}
                              onClick={() => openShipmentStatus(item)}
                            >
                              Update tracking
                            </button>
                          )}
                      </div>
                    </td>
                    {page === "tasks" && (
                      <td>
                        <div className="toolbar-right inventory-toolbar-actions">
                          {[
                            "ADMIN",
                            "HR_MANAGER",
                            "INVENTORY_MANAGER",
                            "RECEIVING_STAFF",
                            "DISPATCH_STAFF",
                          ].includes(user?.role) &&
                            item.status === "PENDING" && (
                              <button
                                className="secondary-btn"
                                disabled={saving}
                                onClick={() =>
                                  workflowAction(item, "IN_PROGRESS")
                                }
                              >
                                Start
                              </button>
                            )}
                          {[
                            "ADMIN",
                            "HR_MANAGER",
                            "INVENTORY_MANAGER",
                            "RECEIVING_STAFF",
                            "DISPATCH_STAFF",
                          ].includes(user?.role) &&
                            item.status === "IN_PROGRESS" && (
                              <button
                                className="primary-btn"
                                disabled={saving}
                                onClick={() =>
                                  workflowAction(item, "COMPLETED")
                                }
                              >
                                Complete
                              </button>
                            )}
                          {[
                            "ADMIN",
                            "HR_MANAGER",
                            "INVENTORY_MANAGER",
                          ].includes(user?.role) &&
                            !["COMPLETED", "CANCELLED"].includes(
                              item.status,
                            ) && (
                              <button
                                className="secondary-btn"
                                disabled={saving}
                                onClick={() =>
                                  workflowAction(item, "CANCELLED")
                                }
                              >
                                Cancel
                              </button>
                            )}
                        </div>
                      </td>
                    )}
                    {page === "bonus-records" && (
                      <td>
                        {["ADMIN", "HR_MANAGER"].includes(user?.role) &&
                        item.approvalStatus === "PENDING" ? (
                          <div className="toolbar-right inventory-toolbar-actions">
                            <button
                              className="primary-btn"
                              disabled={saving || !item.eligible}
                              onClick={() => workflowAction(item, "APPROVED")}
                            >
                              Approve
                            </button>
                            <button
                              className="secondary-btn"
                              disabled={saving}
                              onClick={() => workflowAction(item, "REJECTED")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="status-pill neutral">
                            {item.approvalStatus || "PENDING"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-foot">
          <span>
            <span className="live-dot" /> Connected data source
          </span>
          <span>
            Page 1{" "}
            <span className="foot-muted">· Pagination available in API</span>
          </span>
        </div>
      </div>
      {page === "inventory" && operation && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOperation("");
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">INVENTORY TRANSACTION</span>
                <h2>
                  {operation === "receipts"
                    ? "Receive stock"
                    : operation === "dispatches"
                      ? "Dispatch stock"
                      : operation === "damaged-disposition"
                        ? "Inspect damaged stock"
                        : "Adjust stock"}
                </h2>
                <p>
                  Enter a real product ID from the Products section. Stock
                  changes are validated by the backend.
                </p>
              </div>
              <button className="icon-btn" onClick={() => setOperation("")}>
                <X size={19} />
              </button>
            </div>
            <form onSubmit={submitOperation}>
              <div className="form-grid">
                <label className="wide-field">
                  Product
                  <select
                    required
                    value={form.productId || ""}
                    disabled={productsLoading || saving}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        productId: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {productsLoading
                        ? "Loading products..."
                        : products.length === 0
                          ? "No active products available"
                          : "Select a product"}
                    </option>

                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} — {product.sku}
                      </option>
                    ))}
                  </select>
                </label>
                {operation === "receipts" ? (
                  <>
                    <label>
                      Accepted quantity
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.acceptedQuantity ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, acceptedQuantity: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Damaged quantity
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.damagedQuantity ?? "0"}
                        onChange={(e) =>
                          setForm({ ...form, damagedQuantity: e.target.value })
                        }
                      />
                    </label>
                  </>
                ) : operation === "dispatches" ? (
                  <label>
                    Quantity to dispatch
                    <input
                      type="number"
                      min="0.0001"
                      step="any"
                      value={form.quantity || ""}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                      required
                    />
                  </label>
                ) : operation === "damaged-disposition" ? (
                  <>
                    <label>
                      Damaged quantity to inspect
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        value={form.quantity || ""}
                        onChange={(e) =>
                          setForm({ ...form, quantity: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Decision
                      <select
                        value={form.action || "RELEASE"}
                        onChange={(e) =>
                          setForm({ ...form, action: e.target.value })
                        }
                      >
                        <option value="RELEASE">Release as sellable</option>
                        <option value="WRITE_OFF">
                          Write off damaged stock
                        </option>
                      </select>
                    </label>
                  </>
                ) : (
                  <label>
                    Quantity change (+/-)
                    <input
                      type="number"
                      step="any"
                      value={form.quantityDelta || ""}
                      onChange={(e) =>
                        setForm({ ...form, quantityDelta: e.target.value })
                      }
                      required
                      placeholder="e.g. 5 or -2"
                    />
                  </label>
                )}
                <label>
                  Reference
                  <input
                    value={form.reference || ""}
                    onChange={(e) =>
                      setForm({ ...form, reference: e.target.value })
                    }
                    placeholder="PO / order / document reference"
                  />
                </label>
                <label className="wide-field">
                  Reason
                  <input
                    required={
                      operation === "adjustments" ||
                      operation === "damaged-disposition"
                    }
                    minLength={
                      operation === "adjustments" ||
                      operation === "damaged-disposition"
                        ? 3
                        : undefined
                    }
                    value={
                      form.reason ??
                      (operation === "receipts"
                        ? "Goods received"
                        : operation === "dispatches"
                          ? "Stock dispatched"
                          : "")
                    }
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    placeholder="Reason for this transaction"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setOperation("")}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Processing…" : "Submit transaction"}{" "}
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </form>
            <p className="modal-hint">
              <ShieldCheck size={14} /> The backend validates permissions and
              prevents invalid stock changes.
            </p>
          </div>
        </div>
      )}
      {canCreate && showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">NEW RECORD</span>
                <h2>Add {singular(page)}</h2>
                <p>Enter the record details below.</p>
              </div>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>
                <X size={19} />
              </button>
            </div>
            <form onSubmit={create}>
              <div className="form-grid">
                {config.map(([key, label, type, requiredOrOpts]) => (
                  <label
                    key={key}
                    className={
                      type === "text" &&
                      [
                        "description",
                        "address",
                        "notes",
                        "destinationAddress",
                        "originAddress",
                        "billingAddress",
                        "notes",
                        "trackingUrl",
                        "proofOfDeliveryUrl",
                      ].includes(key)
                        ? "wide-field"
                        : ""
                    }
                  >
                    {label}
                    {type === "select" ? (
                      <select
                        value={
                          form[key] ??
                          (key === "type"
                            ? "COURIER"
                            : key === "employmentType"
                              ? "EMPLOYEE"
                              : key === "priority"
                                ? "MEDIUM"
                                : key === "status"
                                  ? "ACTIVE"
                                  : key === "eligible"
                                    ? "false"
                                    : "")
                        }
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                      >
                        {(Array.isArray(requiredOrOpts)
                          ? requiredOrOpts
                          : ["ACTIVE", "INACTIVE"]
                        ).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          type === "number"
                            ? "number"
                            : type === "email"
                              ? "email"
                              : type === "url"
                                ? "url"
                                : type === "datetime-local"
                                  ? "datetime-local"
                                  : "text"
                        }
                        min={type === "number" ? "0" : undefined}
                        max={key === "taxRatePercent" ? "100" : undefined}
                        step={type === "number" ? "any" : undefined}
                        required={requiredOrOpts === true}
                        value={form[key] ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                        placeholder={label}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving…" : `Create ${singular(page)}`}{" "}
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </form>
            <p className="modal-hint">
              <ShieldCheck size={14} /> Your account's backend permissions are
              enforced when saving.
            </p>
          </div>
        </div>
      )}

      {shipmentStatusTarget && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShipmentStatusTarget(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipment-tracking-title"
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">SHIPMENT WORKFLOW</span>
                <h2 id="shipment-tracking-title">Update tracking</h2>
                <p>
                  {shipmentStatusTarget.shipmentCode} · Current status:{" "}
                  {shipmentStatusTarget.status.replaceAll("_", " ")}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShipmentStatusTarget(null)}
                aria-label="Close tracking form"
              >
                <X size={19} />
              </button>
            </div>
            <form onSubmit={updateShipmentStatus}>
              <div className="form-grid">
                <label>
                  New status
                  <select
                    required
                    value={shipmentStatusForm.status}
                    onChange={(e) =>
                      setShipmentStatusForm({
                        ...shipmentStatusForm,
                        status: e.target.value,
                      })
                    }
                  >
                    {(
                      shipmentTransitions[shipmentStatusTarget.status] || []
                    ).map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Current location (optional)
                  <input
                    maxLength={240}
                    value={shipmentStatusForm.location}
                    onChange={(e) =>
                      setShipmentStatusForm({
                        ...shipmentStatusForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Jaipur sorting hub"
                  />
                </label>
                <label className="wide-field">
                  Tracking note (optional)
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={shipmentStatusForm.notes}
                    onChange={(e) =>
                      setShipmentStatusForm({
                        ...shipmentStatusForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Operational update, delay reason, delivery note…"
                  />
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShipmentStatusTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving || !shipmentStatusForm.status}
                >
                  {saving ? "Saving update…" : "Save tracking update"}
                </button>
              </div>
            </form>
            <p className="modal-hint">
              Each successful status update is added to the shipment timeline.
              Dispatching also records the corresponding inventory movement.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
export default ResourcePage;
