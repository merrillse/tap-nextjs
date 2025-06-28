import { NextRequest, NextResponse } from 'next/server';

// Test endpoint that simulates successful INQ API responses
export async function POST(request: NextRequest) {
  try {
    const { environment, query } = await request.json();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock missionary data (expanded for better demo)
    const mockMissionaries = [
      {
        "@odata.etag": "W/\"775947911\"",
        "inq_missionaryid": "a106e921-ee4d-f011-8779-000d3a3113ca",
        "inq_name": "Gracia, William Robert (202139)",
        "inq_missionarynumber": "202139",
        "inq_calculatedstatus": "In-field",
        "inq_startdate": "2025-08-15",
        "inq_calculatedreleasedate": "2027-08-15",
        "inq_officiallastname": "Gracia",
        "inq_officialfirstname": "William",
        "inq_officialmiddlename": "Robert",
        "inq_personalemail": "williamgracia2106@gmail.com",
        "inq_mobilephone": "(310) 818-1732",
        "inq_homephone": "(310) 291-8404",
        "inq_birthdate": "2006-02-01T00:00:00Z",
        "inq_age": "19y, 4m",
        "inq_comp": "English SerMis Eld"
      },
      {
        "@odata.etag": "W/\"775947912\"",
        "inq_missionaryid": "b206e921-ee4d-f011-8779-000d3a3113cb",
        "inq_name": "Smith, James Michael (202140)",
        "inq_missionarynumber": "202140",
        "inq_calculatedstatus": "In-field",
        "inq_startdate": "2025-07-10",
        "inq_calculatedreleasedate": "2027-07-10",
        "inq_officiallastname": "Smith",
        "inq_officialfirstname": "James",
        "inq_officialmiddlename": "Michael",
        "inq_personalemail": "james.smith.mission@gmail.com",
        "inq_mobilephone": "(555) 123-4567",
        "inq_birthdate": "2005-11-15T00:00:00Z",
        "inq_age": "19y, 7m",
        "inq_comp": "Spanish SerMis Eld"
      },
      {
        "@odata.etag": "W/\"775947913\"",
        "inq_missionaryid": "c306e921-ee4d-f011-8779-000d3a3113cc",
        "inq_name": "Johnson, Sarah Elizabeth (202141)",
        "inq_missionarynumber": "202141",
        "inq_calculatedstatus": "Released",
        "inq_startdate": "2023-09-01",
        "inq_calculatedreleasedate": "2025-03-01",
        "inq_officiallastname": "Johnson",
        "inq_officialfirstname": "Sarah",
        "inq_officialmiddlename": "Elizabeth",
        "inq_personalemail": "sarah.johnson@example.com",
        "inq_mobilephone": "(555) 987-6543",
        "inq_birthdate": "2004-05-20T00:00:00Z",
        "inq_age": "21y, 1m",
        "inq_comp": "English SerMis Sis"
      },
      {
        "@odata.etag": "W/\"775947914\"",
        "inq_missionaryid": "d406e921-ee4d-f011-8779-000d3a3113cd",
        "inq_name": "Martinez, Carlos Antonio (202142)",
        "inq_missionarynumber": "202142",
        "inq_calculatedstatus": "In-field",
        "inq_startdate": "2025-06-01",
        "inq_calculatedreleasedate": "2027-06-01",
        "inq_officiallastname": "Martinez",
        "inq_officialfirstname": "Carlos",
        "inq_officialmiddlename": "Antonio",
        "inq_personalemail": "carlos.martinez.mission@gmail.com",
        "inq_mobilephone": "(555) 456-7890",
        "inq_birthdate": "2005-12-03T00:00:00Z",
        "inq_age": "19y, 6m",
        "inq_comp": "Portuguese SerMis Eld"
      },
      {
        "@odata.etag": "W/\"775947915\"",
        "inq_missionaryid": "e506e921-ee4d-f011-8779-000d3a3113ce",
        "inq_name": "Chen, David Wei (202143)",
        "inq_missionarynumber": "202143",
        "inq_calculatedstatus": "Preparing",
        "inq_startdate": "2025-09-15",
        "inq_calculatedreleasedate": "2027-09-15",
        "inq_officiallastname": "Chen",
        "inq_officialfirstname": "David",
        "inq_officialmiddlename": "Wei",
        "inq_personalemail": "david.chen@example.com",
        "inq_mobilephone": "(555) 321-6547",
        "inq_birthdate": "2006-01-18T00:00:00Z",
        "inq_age": "19y, 5m",
        "inq_comp": "Mandarin SerMis Eld"
      }
    ];

    // Filter based on query parameters
    let filteredData = [...mockMissionaries];
    const topMatch = query.match(/\$top=(\d+)/);
    const filterMatch = query.match(/\$filter=([^&]+)/);
    
    if (filterMatch) {
      const filterValue = decodeURIComponent(filterMatch[1]);
      if (filterValue.includes("eq 'In-field'")) {
        filteredData = filteredData.filter(m => m.inq_calculatedstatus === 'In-field');
      }
      if (filterValue.includes("eq '202139'")) {
        filteredData = filteredData.filter(m => m.inq_missionarynumber === '202139');
      }
    }
    
    if (topMatch) {
      const topCount = parseInt(topMatch[1]);
      filteredData = filteredData.slice(0, topCount);
    }

    const mockResponse = {
      success: true,
      environment: environment,
      query: query,
      queryUrl: `https://inq-${environment.toLowerCase()}.api.crm.dynamics.com/api/data/v9.2/${query}`,
      timestamp: new Date().toISOString(),
      recordCount: filteredData.length,
      totalCount: mockMissionaries.length,
      hasNextPage: filteredData.length < mockMissionaries.length,
      nextLink: filteredData.length < mockMissionaries.length ? 
        `https://inq-${environment.toLowerCase()}.api.crm.dynamics.com/api/data/v9.2/${query}&$skiptoken=mock-token-${filteredData.length}` : null,
      data: {
        "@odata.context": `https://inq-${environment.toLowerCase()}.api.crm.dynamics.com/api/data/v9.2/$metadata#inq_missionaries`,
        "@odata.count": mockMissionaries.length,
        "@odata.nextLink": filteredData.length < mockMissionaries.length ? 
          `https://inq-${environment.toLowerCase()}.api.crm.dynamics.com/api/data/v9.2/${query}&$skiptoken=mock-token-${filteredData.length}` : undefined,
        value: filteredData
      }
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
