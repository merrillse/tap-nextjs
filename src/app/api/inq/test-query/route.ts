import { NextRequest, NextResponse } from 'next/server';

// Test endpoint that simulates successful INQ API responses
export async function POST(request: NextRequest) {
  try {
    const { environment, query } = await request.json();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate more mock missionaries for pagination demo
    const generateMockMissionaries = () => {
      const missionaries = [
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
        }
      ];
      
      // Add more generated missionaries
      const firstNames = ['David', 'Emily', 'Joshua', 'Ashley', 'Matthew', 'Hannah', 'Andrew', 'Rebecca', 'Tyler', 'Jessica', 'Nathan', 'Amanda', 'Benjamin', 'Rachel', 'Jacob', 'Sarah', 'Samuel', 'Megan', 'Daniel', 'Stephanie'];
      const lastNames = ['Anderson', 'Brown', 'Davis', 'Garcia', 'Johnson', 'Jones', 'Martinez', 'Miller', 'Rodriguez', 'Smith', 'Taylor', 'Thomas', 'White', 'Williams', 'Wilson', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson'];
      const statuses = ['In-field', 'Preparing', 'Released'];
      const comps = ['English SerMis Eld', 'Spanish SerMis Eld', 'French SerMis Eld', 'German SerMis Eld', 'Italian SerMis Eld', 'Portuguese SerMis Eld', 'Japanese SerMis Eld', 'Korean SerMis Eld', 'Mandarin SerMis Eld', 'English SerMis Sis', 'Spanish SerMis Sis', 'French SerMis Sis'];
      
      for (let i = 4; i <= 50; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const status = statuses[i % statuses.length];
        const comp = comps[i % comps.length];
        const missionaryNumber = (202139 + i).toString();
        
        missionaries.push({
          "@odata.etag": `W/"77594791${i}"`,
          "inq_missionaryid": `${i.toString().padStart(2, '0')}06e921-ee4d-f011-8779-000d3a3113c${String.fromCharCode(97 + (i % 26))}`,
          "inq_name": `${lastName}, ${firstName} (${missionaryNumber})`,
          "inq_missionarynumber": missionaryNumber,
          "inq_calculatedstatus": status,
          "inq_startdate": status === 'Released' ? "2023-09-01" : "2025-06-01",
          "inq_calculatedreleasedate": status === 'Released' ? "2025-03-01" : "2027-06-01",
          "inq_officiallastname": lastName,
          "inq_officialfirstname": firstName,
          "inq_officialmiddlename": "Test",
          "inq_personalemail": `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          "inq_mobilephone": `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          "inq_birthdate": "2005-06-01T00:00:00Z",
          "inq_age": "20y, 0m",
          "inq_comp": comp
        });
      }
      
      return missionaries;
    };
    
    // Mock missionary data (expanded for better demo)
    const mockMissionaries = generateMockMissionaries();

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
