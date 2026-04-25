import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { companyService } from "../../../services/supabaseService";

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all, active, inactive
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    city: "",
    country: "",
    phone: "",
    website: "",
    employee_count: 0,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      // Get all companies including inactive ones for admin management
      const { data, error } = await companyService.getAllCompanies(false);
      if (!error && data) {
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (companyId, currentStatus) => {
    if (
      !confirm(
        `Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this company?`
      )
    ) {
      return;
    }

    setUpdatingId(companyId);
    try {
      const { error } = await companyService.updateCompanyStatus(
        companyId,
        !currentStatus
      );

      if (!error) {
        // Update local state
        setCompanies((prev) =>
          prev.map((company) =>
            company.id === companyId
              ? { ...company, is_active: !currentStatus }
              : company
          )
        );
      } else {
        alert("Failed to update company status");
      }
    } catch (error) {
      console.error("Error updating company status:", error);
      alert("Failed to update company status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedCompany(null);
    setFormData({
      name: "",
      industry: "",
      city: "",
      country: "",
      phone: "",
      website: "",
      employee_count: 0,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (company) => {
    setModalMode("edit");
    setSelectedCompany(company);
    setFormData({
      name: company?.name || "",
      industry: company?.industry || "",
      city: company?.city || "",
      country: company?.country || "",
      phone: company?.phone || "",
      website: company?.website || "",
      employee_count: company?.employee_count || 0,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "employee_count" ? Number(value || 0) : value,
    }));
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.name?.trim()) {
      setFormError("Company name is required.");
      return;
    }

    setUpdatingId(selectedCompany?.id || "create");
    try {
      if (modalMode === "create") {
        const { data, error } = await companyService.createCompany(formData);
        if (error) {
          setFormError(error.message || "Failed to create company.");
          return;
        }
        if (data) {
          setCompanies((prev) => [...prev, data].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
        }
        setIsModalOpen(false);
        return;
      }

      const { data, error } = await companyService.updateCompanyDetails(
        selectedCompany.id,
        formData,
      );
      if (error) {
        setFormError(error.message || "Failed to update company.");
        return;
      }
      if (data) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)),
        );
      }
      setIsModalOpen(false);
    } catch (error) {
      setFormError(error?.message || "Failed to save company.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    if (filter === "active") return company.is_active;
    if (filter === "inactive") return !company.is_active;
    return true;
  });

  const activeCount = companies.filter((c) => c.is_active).length;
  const inactiveCount = companies.filter((c) => !c.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage company details and activation status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2">
            <Icon name="Plus" size={14} />
            Add Company
          </Button>
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Active</div>
            <div className="text-2xl font-bold text-green-700">
              {activeCount}
            </div>
          </div>
          <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-600 font-medium">Inactive</div>
            <div className="text-2xl font-bold text-red-700">
              {inactiveCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "all"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Companies ({companies.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "active"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter("inactive")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "inactive"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Industry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No companies found
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  className={!company.is_active ? "bg-gray-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            company.is_active ? "bg-blue-100" : "bg-gray-300"
                          }`}
                        >
                          <Icon
                            name="Building2"
                            size={20}
                            className={
                              company.is_active
                                ? "text-blue-600"
                                : "text-gray-500"
                            }
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div
                          className={`text-sm font-medium ${
                            company.is_active
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {company.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {company.employee_count || 0} employees
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.industry || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.city && company.country
                        ? `${company.city}, ${company.country}`
                        : company.country || company.city || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.phone || "—"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {company.website || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        company.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {company.is_active ? (
                        <>
                          <Icon name="CheckCircle" size={14} className="mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Icon name="XCircle" size={14} className="mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(company)}
                        disabled={updatingId === company.id}
                        className="gap-2"
                      >
                        <Icon name="Pencil" size={14} />
                        Edit
                      </Button>
                      <Button
                        variant={company.is_active ? "outline" : "primary"}
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(company.id, company.is_active)
                        }
                        disabled={updatingId === company.id}
                        className="gap-2"
                      >
                        {updatingId === company.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            Updating...
                          </>
                        ) : company.is_active ? (
                          <>
                            <Icon name="Ban" size={14} />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Icon name="CheckCircle" size={14} />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {modalMode === "create" ? "Add Company" : "Edit Company"}
                </div>
                <div className="text-sm text-gray-600">
                  Update company name and details
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <Icon name="X" size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-4">
              {formError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    name="industry"
                    value={formData.industry}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Industry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Website"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Count
                  </label>
                  <input
                    name="employee_count"
                    type="number"
                    value={formData.employee_count}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={updatingId === (selectedCompany?.id || "create")}
                className="gap-2"
              >
                {updatingId === (selectedCompany?.id || "create") ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={14} />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              About Company Status
            </h4>
            <p className="text-sm text-blue-800">
              Deactivating a company will hide it from all dropdowns and
              listings across the system. Users associated with inactive
              companies will not be able to access company-specific features.
              You can reactivate a company at any time to restore full access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;
