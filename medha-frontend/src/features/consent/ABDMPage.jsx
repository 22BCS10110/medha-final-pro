/**
 * ABDMPage — Full-page ABDM Consent Manager wrapped in AdminLayout
 */
import React from "react";
import AdminLayout from "../admin/AdminLayout";
import ABDMConsentDashboard from "./ABDMConsentDashboard";

const ABDMPage = () => {
  return (
    <AdminLayout title="ABDM Consent Manager">
      <ABDMConsentDashboard role="admin" />
    </AdminLayout>
  );
};

export default ABDMPage;
