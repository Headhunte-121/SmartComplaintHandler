/**
 * SmartComplaintHandler - Campus Digital Twin Infrastructure API Transport
 * Role: Communicates with backend /campus endpoints to synchronize persistent buildings,
 *       floors, and room entities.
 */
import apiClient from './client';

/**
 * Fetch list of campus buildings from backend server.
 */
export async function fetchCampusBuildings() {
  const response = await apiClient.get('/campus/buildings');
  return response.data;
}

/**
 * Create a new campus building entity.
 */
export async function createCampusBuilding(buildingData) {
  const response = await apiClient.post('/campus/buildings', buildingData);
  return response.data;
}

/**
 * Update an existing campus building entity.
 */
export async function updateCampusBuilding(buildingId, buildingData) {
  const response = await apiClient.put(`/campus/buildings/${buildingId}`, buildingData);
  return response.data;
}

/**
 * Delete a campus building entity (SuperAdmin only).
 */
export async function deleteCampusBuilding(buildingId) {
  const response = await apiClient.delete(`/campus/buildings/${buildingId}`);
  return response.data;
}

/**
 * Fetch campus road and footpath network from database.
 */
export async function fetchCampusRoads() {
  const response = await apiClient.get('/campus/roads');
  return response.data;
}

/**
 * Bulk synchronize GIS Studio entities directly into database.
 */
export async function syncCampusData(payload) {
  const response = await apiClient.post('/campus/sync', payload);
  return response.data;
}

/**
 * Reset campus buildings catalog to institutional defaults in database.
 */
export async function resetCampusBuildings() {
  const response = await apiClient.post('/campus/reset');
  return response.data;
}

