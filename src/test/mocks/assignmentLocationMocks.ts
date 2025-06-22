import { vi } from 'vitest'

// Define interfaces locally to avoid import issues
interface LabelValue {
  value: number;
  label: string;
}

interface MMSOrganization {
  id: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
  officialShortName?: string;
}

interface MissionaryType {
  id: string;
  abbreviation?: string;
  missionaryTypeName?: string;
  missionaryTypeCode?: string;
}

interface Component {
  id: string;
  complement?: number;
  replacement?: boolean;
  description?: string;
  status?: LabelValue;
  missionaryType?: MissionaryType;
}

interface MissionaryHistory {
  legacyMissId?: number;
  assignmentLocationId?: number;
  assignmentLocationName?: string;
  effectiveDate?: string;
  effectiveEndDate?: string;
  areaName?: string;
  roleType?: string;
  unitNumber?: number;
}

interface AssignmentLocation {
  id: string;
  name?: string;
  assignmentMeetingName?: string;
  effectiveDate?: string;
  componentOvertolerancePercentage?: number;
  type?: LabelValue;
  status?: LabelValue;
  colOrganization?: MMSOrganization;
  complement?: number;
  maxTransfer?: number;
  bikeCost?: number;
  faxRecommends?: boolean;
  returnOnLaborRating?: string;
  timeDiffMST?: string;
  createdDate?: string;
  airportCode?: number;
  privateFlag?: boolean;
  transferDay?: string;
  legacyId?: number;
  components?: Component[];
  curricula?: LabelValue[];
  missionaryHistories?: MissionaryHistory[];
}

export const mockValidAssignmentLocation: AssignmentLocation = {
  id: "12345",
  name: "Test Mission Brazil",
  assignmentMeetingName: "Brazil Sao Paulo Mission",
  effectiveDate: "2023-01-01",
  componentOvertolerancePercentage: 10,
  type: {
    value: 1,
    label: "MISSION"
  },
  status: {
    value: 1,
    label: "ACTIVE"
  },
  colOrganization: {
    id: "org123",
    organizationId: 12345,
    name: "Brazil Sao Paulo Mission",
    officialName: "The Church of Jesus Christ of Latter-day Saints - Brazil Sao Paulo Mission",
    shortName: "BSP Mission",
    officialShortName: "BSP"
  },
  complement: 150,
  maxTransfer: 30,
  bikeCost: 250,
  faxRecommends: true,
  returnOnLaborRating: "HIGH",
  timeDiffMST: "-2:00",
  createdDate: "2020-01-01",
  airportCode: 1234,
  privateFlag: false,
  transferDay: "TUESDAY",
  legacyId: 98765,
  components: [
    {
      id: "comp1",
      complement: 2,
      replacement: false,
      description: "Zone Leader",
      status: { value: 1, label: "ACTIVE" },
      missionaryType: {
        id: "mt1",
        abbreviation: "E",
        missionaryTypeName: "Elder",
        missionaryTypeCode: "ELDER"
      }
    }
  ],
  curricula: [
    { value: 1, label: "Standard Curriculum" }
  ],
  missionaryHistories: [
    {
      legacyMissId: 123456,
      assignmentLocationId: 12345,
      assignmentLocationName: "Brazil Sao Paulo Mission",
      effectiveDate: "2023-01-01",
      effectiveEndDate: "2024-12-31",
      areaName: "Central Area",
      roleType: "Zone Leader",
      unitNumber: 54321
    }
  ]
}

export const mockApiClient = {
  executeGraphQLQuery: vi.fn()
}

export const mockEnvironments = {
  'mogs-gql-dev': {
    url: 'https://dev.mogs.example.com/graphql',
    headers: { 'x-api-key': 'dev-key' }
  },
  'mogs-gql-local': {
    url: 'http://localhost:8080/graphql',
    headers: {}
  },
  'mogs-gql-prod': {
    url: 'https://prod.mogs.example.com/graphql',
    headers: { 'x-api-key': 'prod-key' }
  }
}
