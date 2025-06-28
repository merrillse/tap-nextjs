'use client';

import { useState } from 'react';
import { PlayIcon, DocumentDuplicateIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Environment {
  name: string;
  baseUrl: string;
  clientId: string;
  scope: string;
  description: string;
}

const INQ_ENVIRONMENTS: Environment[] = [
  {
    name: 'Dev',
    baseUrl: 'https://inq-dev.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-dev.crm.dynamics.com/.default',
    description: 'Development environment for testing and integration'
  },
  {
    name: 'Test',
    baseUrl: 'https://inq-test.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-test.crm.dynamics.com/.default',
    description: 'Test environment for validation and QA'
  },
  {
    name: 'Stage',
    baseUrl: 'https://inq-stage.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-stage.crm.dynamics.com/.default',
    description: 'Staging environment for pre-production testing'
  },
  {
    name: 'Prod',
    baseUrl: 'https://inq.api.crm.dynamics.com/api/data/v9.2',
    clientId: '5e6b7d0b-7247-429b-b8c1-d911d8f13d40',
    scope: 'https://inq.crm.dynamics.com/.default',
    description: 'Production environment for live data'
  }
];

const SAMPLE_MISSIONARY = {
  "@odata.context": "https://inq-dev.api.crm.dynamics.com/api/data/v9.2/$metadata#inq_missionaries",
  "value": [
    {
      "@odata.etag": "W/\"775947911\"",
      "inq_vehiclefeeholder": null,
      "inq_estimatedtravelcost": null,
      "inq_assaultsurvivor": false,
      "inq_latinmiddlename": "Robert",
      "inq_doctorsevaluation": "2025-02-28",
      "inq_recommendnamesuffix": null,
      "inq_purge": false,
      "_ownerid_value": "7527262e-a0b9-ee11-a569-002248090557",
      "inq_nationalidconfirmationsecond": null,
      "inq_airportofmissionandhomeunit": null,
      "inq_recommendedatheadquarters": "2025-04-28",
      "importsequencenumber": null,
      "inq_subsidyname": null,
      "utcconversiontimezonecode": null,
      "inq_comp": "English SerMis Eld",
      "inq_anniversarydate": "2027-06-20T09:43:55Z",
      "overriddencreatedon": "2025-06-20T15:49:24Z",
      "inq_releasedate": null,
      "inq_callviewed": null,
      "inq_personalemail": "williamgracia2106@gmail.com",
      "inq_otherfunding": null,
      "inq_secondcandidateaccesstomedicalcare": null,
      "inq_homeaddressstreet3": null,
      "inq_officialmiddlename": "Robert",
      "_inq_assignmentlocation_value": "a34c8f79-cfa0-ec11-b400-000d3a3597b5",
      "inq_calculatedtaxyearstartdate": null,
      "_inq_gvmmissionary_value": null,
      "inq_gvmadditionalcomments": null,
      "inq_newamount": null,
      "_transactioncurrencyid_value": "5cfa3364-619f-eb11-b1ac-002248047e97",
      "inq_totalunreversedchargesamount_base": 0.0000000000,
      "inq_emailprovisioningstatus": null,
      "_inq_recommend_value": "cb05c3df-ed4d-f011-8779-6045bd018176",
      "inq_equalizedyn1": "Yes",
      "inq_daysuntilstart": 48.0000000000,
      "inq_certificatename": "William Robert Gracia",
      "inq_outboundtravelpaidby": true,
      "inq_imageid": "2661615d-ee4d-f011-8779-000d3a35ea08",
      "inq_nationalidconfirmationfirst": null,
      "emailaddress": null,
      "inq_requestedby": null,
      "inq_birthplace": "Torrance, CA",
      "inq_primarylanguage": 0,
      "inq_cantextmobilephone": true,
      "inq_insurancecost_base": null,
      "inq_callaccepted": null,
      "inq_certificaterequested": false,
      "inq_calllettercountry": null,
      "inq_calculatedreleasedate_state": 1,
      "inq_totalunreversedchargesamount_date": "2025-06-28T05:30:25Z",
      "inq_homeaddressstreet2": null,
      "_owninguser_value": null,
      "inq_gvmtraveldatetomission": null,
      "inq_leadersignature": null,
      "inq_monthlychargecalc_base": null,
      "inq_callsentdate": "2025-06-20T15:58:07Z",
      "inq_psychreviewdate": null,
      "_inq_submittingunit_value": "db789ed5-bfda-ec11-a7b6-0022480b6e52",
      "inq_workforceenabled": false,
      "inq_futurestatusreason": null,
      "inq_mentalhealthreview": false,
      "inq_calculatedreleasedate": "2027-08-15",
      "inq_totalunreversedcharges_state": 1,
      "inq_gvmdelaycreatedate": null,
      "inq_lastfourdigits": null,
      "inq_homeunitname": "Redondo  2nd Ward (20877)",
      "inq_preferrednamesuffix": null,
      "inq_callletterdistrict": null,
      "inq_legacycmisid": "18589018551",
      "inq_sourceofdata": 447160001,
      "_createdby_value": "23f3d7b4-649e-ec11-b400-000d3a3592b9",
      "inq_calllength": 24,
      "inq_localizedname": null,
      "inq_housingsubsidypercent": null,
      "inq_cmislatingivennames": "William Robert",
      "inq_housingchargecommitment_base": null,
      "inq_executivesummary": null,
      "inq_missionarynumber": "202139",
      "inq_homeaddressstreet1": "20560 Anza Ave. apt 1",
      "inq_preferredmiddlename": "Robert",
      "inq_calculatedmembershipunit": null,
      "inq_imageurl": null,
      "_inq_stakeordistrict_value": "b4789ed5-bfda-ec11-a7b6-0022480b6e52",
      "inq_returntravelpaidby": false,
      "_modifiedby_value": "06e38bc7-63d1-ec11-a7b5-6045bd0118c4",
      "inq_medicallycleared": 121640002,
      "inq_totalunreversedcharges_date": "2025-06-28T05:30:25Z",
      "timezoneruleversionnumber": 0,
      "inq_mobilephone": "(310) 818-1732",
      "inq_clearedfortravelnote": null,
      "inq_missionarytype": 1,
      "inq_totalfunding": 400.0000,
      "inq_cmislatinsurname": "Gracia",
      "_owningteam_value": "7527262e-a0b9-ee11-a569-002248090557",
      "inq_preferredfirstname": "William",
      "inq_estimatedpersonalcost_base": null,
      "inq_subsidyid": null,
      "_inq_calllettercountryid_value": "d79ac263-0c55-e711-80f1-c4346bac4304",
      "inq_calllettercity": "Torrance",
      "inq_image_timestamp": 638860314640984689,
      "inq_minimumcontributionamountid": null,
      "inq_callletterstateprovence": "CA",
      "inq_dentistsevaluation": "2025-03-05",
      "_modifiedonbehalfby_value": null,
      "inq_recommendfirstname": "William",
      "inq_medicalid": null,
      "inq_image": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCACQAJADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD2LNGeKZS5qAHZpwNRZOaQyYFAE28A0eaB3qjJcAZ5rK1LWIrK3eaR8Ko/Oi47G3c6jBaxNJLIqIBySa5XUviDZwZW1RpmHc8CuA1jxHc6pOS7lYgflQHgVhvc7iRmqSEd6/xC1Bm4SNR6YqeD4g3K4EsUbfpXm4nJzhunrSx3RzhqLAe2aT4w0/UAFeQQSf3WPB/GuijmDLlSCD0Ir57S6PY10Wg+I9RtLuNY5mdSQPLY5BosB7OGBp1VLa4E0CPjBYZI9KsbjUgPpQaaDmloAfSGkzQTQBRyRS7qZkUZoHYVmqrNLjPNSyHis65kwpoYIrXV1gHmvNfE+svd3bQh/wB1GcAeprstSuCkErjqqk15VcOZHOfvE5NKKGxnmMxzUkUErPkRsR7Cn2FjLcXiqUIUcnIrsrezVFAVaU6iibUqPPqzi/ssyucRsfwpPsU5/wCWbflXfLbgNkqPyp3koCMKPyqPbM2+qruefCJ0Gec1o2TzWU8cuCGByCa6x7CAuHMS7vXFZurWo+zl1GCvNVGrd2M54eyujtfC/ioX8gtrkKsp+6R0NdoprwrSJnjv4HQ4YSDH517hAT5a56gVozlJ6eOlMpy+lIB1FFFAGdRSc/WjOTQWRy9Ky7snaa035FZl392lIDmtV/49ph6of5V55ax+bfxoR/FXouoAMrD1GK4rTrZo9VYOuGQNUp2TKgrsu3GoJaOI449zd8CrMGvxLhZYXj98VDclInGItzMetV1mebcGhAAzWSs0dmqe50ttfW99w0XN3BbZLmsewxHPgDGyanv/nlJIzgcVGlzbWwx9eRsiKB2x0OKijvhfpJC67XKnFVRcOr7RETnHIrQsfLlO7y8MOORitNEYO76lHw7AZtetIiPvTLkfQ817aowK8v8Jad5vi1m5AgLSH+Q/nXqI6Vve5wyVmOBp4PNR0+gkko7U0daVvWgDMzg0bqSigsa5wuazLv7laT8jFZt0PlNJgc5eHrWHAgM2WOZCvXvjNbt4pyTWMI2ivC7H7y8e1YzOrD7Mma3BHTJqNrchcngVbjkBHNMuJVkiKL19ayOxR0KltETLlRgCrMkR8z5hnPFU1kuFuAyuAoGNuKlElw029pMqf4cU7DsTi1ZTwPlNWEt1UcDFSLMFUbuRUhcE8UITSsaXh6Hy9WV0GN6kufXiuzXpXLeHFb7W5YcbCR+YrqV6V0U9rnn1/iFpw6U2nDpVmFhacfuim0UBYzN1LuqPNOzU3YwJ4qnOmRVv61HIARTYHN30PWsG4jYyht3TtXVXqDaTXOXAGTUNXLhNxehEmD8p7is67uJbecIEBQ9DVnzCj4zSuqy/eGQa5no9T0Iu6Gwh3w2+Ppk5NWZYfKGTcwjA42nNVBAAcKM1KIFCjcn4VV0avbcTT5ri4eTeB5WcJxya2IIC80cK8sxCiqkWI1BAA9Paui8NWvmytdPyI+F+tNK7MKkuWJuadpq2OW3lmIxWgppKK6UrI89tt3Y+nDpTR0pw6UxC0UUUAY24U4HFVzIB3ppuAO9QBaJ9TUMsqhcZqlLehRyazLnUwMgGhgTXs4wea5+6lUZ5+pqLUdYihG6SDL7dzXK6hrZux5cOVQ9SepppNhc3o3W8j8yMnGSAfoaBK8R2sMitTQ9P+1eG7OaEAyIGDAd/mNRT245yPwrCa1O6k04oghu41znipPtiN0FQi0B6VPHbKo6VKNdRUdpGAArX07Xv7HvI7e5TFnOMrJ6MOD/AEqtbWxYhUXLMcACp/F2m+RoEDYG6Bhkj36/rWtNanLXdkdtHcJIoZWBBGQQetTq4PevJNF8VzaYnkSgyw/wjPK11lj4x0+52hpDEx7OK2s0cqkjsQeaeDWXBfJMoZHVlPcHNXEnBoGWs0tRq2aeD60AcXJeqveqU2onHBrjbzxYORBF+LGsK8127uMhpiB6LxSUWK52uoa7BAD5kwLei8muXvvE8smVgGwep5Nc5LcFu5yfeoGkPrVqArlua6knlLSOWPqTSRt89VFOefWp4utVYR678O7hZdOkt2PMb5H0P+TXUajoUd4heLCyY/A15z8P7swaq0WeJE/lXrcEwJA45rKcbmsJtbHBSWMsEpjkUq49aVIMuBglicADqa2Nd1q3fUPsaW4lMY/eSZxtPpmmaJqNlBqAEkQUMMCVjnBrHl1Oj26sbWj6MLZPPnUeceg/uj/GszxttTw7dM3XKqv1yK6tpMuFWuL+IUgXw+yg8GRfxNbxjY5pty1Z5LJKQ9ItyQetV52OTVfeQetbGB0Vhrd1ZsDDO6Y7A8V1um+O5Fwt1EHH95eDXmKzHPWrUdyR3pOKY02j3XTfE2m3wAS4COf4X4NbayBlBBBHqK+e47xlYc1t6d4lv7PHk3LqB/CTkVLh2K5zhnmJ71CZMnk1GW60zNWJsez89aYWphNNzkigknVqsRNyKqBuanib5hQO51nhW68nW7Qk4BkCk/XivYQ0u/72CBivCNOnMNxHIvBRgw/CvfINt1aJKmPmUOp+tTJFwOE1NltVYTA+dkgD+97msISXVxMFkYhScL/9b1rp/FoiVlkZS23kiq3hURalrSPIyny8hEI6cdamEVFXHJtux6FYxyQ2catKzMAEBPcVyPxNn8qwtYP7zlj+A/8Ar12q4a4CL92KvMfidd79VhhzxHHkj6n/AOtTW4S2PPZn5qqZOeBUkr1XLVZkODckGpFk5qsc7s1IDQBeWXODU8UvP1rPQ5WplcqM+nSgDIY/N9abkYpshwKaDxQMUnnNAbBplFAicEVNGec1UU/NirCmgDTtn2sDXtnhS/8AO8PWcpOdq+W34HFeFwvzXpHg7VVh8N36SHIibKj/AHhx+opMqJL4munur9Y4OcSZJHQfWoLaVdOuoLuD5VicFwPXPP4VZ8JRNcx3st0m5Zn2vn+AAVQ1uF7G9VYPntruit2b2NRGabcRyTtzHq1g5ZGkbG5zmvG/HV19o8SXfzZCEJ+Qr1HSrsfYrZv4ZLcPnPtXiWs3X2rUrmb/npKzfrVIG9DKkbn3qKlkbmos+9UQPPTrQDxTBypNOX0oAnjapV5kVffJqCPr1p6tm5+goA//Z",
      "inq_callletteracceptancetext": null,
      "inq_firstcandidateaccesstomedicalcare": null,
      "inq_calculatedstatus": "In-field",
      "inq_callnotificationscheduleddate": null,
      "inq_calltypecode": null,
      "inq_missionarytravelitinerary": null,
      "_owningbusinessunit_value": "5a7420b2-2d9f-eb11-b1ac-002248047e97",
      "inq_delaytype": null,
      "inq_recommendnumber": "1413486",
      "_createdonbehalfby_value": null,
      "inq_uuid": "75cd6928-08c2-4d7c-aa94-ab5dd4a24e60",
      "modifiedon": "2025-06-20T15:58:12Z",
      "inq_passportnumber": null,
      "inq_donotpurge": false,
      "inq_latinlastname": "Gracia",
      "inq_homeaddresscity": "Torrance",
      "inq_callletterzippostalcode": "90503",
      "inq_parentunitname": "Torrance California North Stake (502391)",
      "statuscode": 447160013,
      "inq_callletteraddressstreet3": null,
      "_inq_membershipunit_value": "db789ed5-bfda-ec11-a7b6-0022480b6e52",
      "inq_wardbranchfunding": null,
      "inq_nationalid": null,
      "inq_wardbranchfunding_base": null,
      "inq_membershipmission": "California Los Angeles Mission (2011107)",
      "inq_age": "19y, 4m",
      "versionnumber": 775947911,
      "inq_refreshfromcmis": false,
      "inq_homeaddressdistrict": null,
      "inq_cmissurname": "Gracia",
      "_inq_permanentassignment_value": "3d3d6b41-ee4d-f011-877a-0022480c68a3",
      "inq_travelsubsidypercent": null,
      "inq_ldsaccountid": "3788468155195441",
      "inq_recommendlastname": "Gracia",
      "inq_vehiclefee_base": null,
      "inq_housingcharge_base": null,
      "inq_equalizedyn": true,
      "inq_otherreviewdate": null,
      "inq_gvmdelaycanceleddate": null,
      "inq_callletteraddressstreet2": null,
      "inq_assignedchurchownedvehicle": null,
      "inq_originalreleasedate": "2027-08-15",
      "inq_newamount_base": null,
      "_inq_missionaryadvocate_value": null,
      "statecode": 0,
      "inq_insurancesubsidypercent": null,
      "inq_gender": 447160000,
      "inq_readytotravel": false,
      "inq_housingchargeholder_base": null,
      "inq_concatfundingunitfinanceinfo": "Equalized/MSF/400/USD",
      "inq_insurancecost": null,
      "inq_recommendmiddlename": "Robert",
      "inq_preferredlastname": "Gracia",
      "inq_personalsubsidypercent": null,
      "inq_officialfirstname": "William",
      "inq_selffunding_base": 0.0000,
      "inq_homephone": "(310) 291-8404",
      "inq_modifiedbyimos": null,
      "inq_startdate": "2025-08-15",
      "inq_hushenddate": "2025-07-05",
      "_inq_homewardbranchstake_value": "db789ed5-bfda-ec11-a7b6-0022480b6e52",
      "inq_msswid": null,
      "exchangerate": 1.0000000000,
      "inq_reasonforchange": null,
      "inq_homeaddressstateprovence": "CA",
      "inq_calculatedreleasedate_date": "2025-06-28T05:30:25Z",
      "inq_vehiclefeeholder_base": null,
      "inq_medicalreviewdate": null,
      "inq_cmisgivennames": "William Robert",
      "inq_housingsweepparticipation": null,
      "inq_equalizedmaxamount": 400.0000000000,
      "inq_housingchargecommitment": null,
      "_inq_funding_value": "db789ed5-bfda-ec11-a7b6-0022480b6e52",
      "inq_familyfunding": 400.0000,
      "inq_callletterphone": "(310) 291-8404",
      "inq_monthlychargecalc": null,
      "inq_officialnamesuffix": null,
      "inq_callletterlanguage": 0,
      "inq_needsgvmchange": false,
      "inq_callletteraddressstreet1": "20560 Anza Ave. apt 1",
      "inq_totalfunding_base": 400.0000,
      "inq_latinfirstname": "William",
      "inq_birthdate": "2006-02-01T00:00:00Z",
      "inq_calculatedfullgivenname": "William Robert Gracia",
      "inq_costsasofdate": "2025-06-20",
      "inq_totalunreversedchargesamount_state": 1,
      "inq_name": "Gracia, William Robert (202139)",
      "_inq_homeaddresscountryid_value": "d79ac263-0c55-e711-80f1-c4346bac4304",
      "inq_otherfunding_base": null,
      "inq_missionaryid": "a106e921-ee4d-f011-8779-000d3a3113ca",
      "_inq_birthcountry_value": "d79ac263-0c55-e711-80f1-c4346bac4304",
      "inq_vehiclefee": null,
      "inq_availabledate": "2025-05-20",
      "inq_assignmentdetailsreporturl": null,
      "inq_calllettertype": false,
      "_inq_reasonforrelease_value": null,
      "inq_selffunding": 0.0000,
      "inq_homeunitparentleaderemail": "kentccarter@gmail.com",
      "inq_isonetimecommitmentenabled": true,
      "inq_monthlycharge": null,
      "inq_assignmentdetailsreport_name": null,
      "inq_homeaddresszippostalcode": "90503",
      "inq_estimatedtravelcost_base": null,
      "inq_maxequalizedamount": null,
      "inq_otherreview": false,
      "inq_missionaryportalpin": "531939",
      "inq_primarymissionary": true,
      "inq_confirmationdate": "2014-03-15",
      "inq_estimatedpersonalcost": null,
      "inq_immunizationstatus": 121640002,
      "createdon": "2025-06-20T15:43:53Z",
      "inq_companionsapp": null,
      "inq_monthlycharge_base": null,
      "inq_officiallastname": "Gracia",
      "inq_familyfunding_base": 400.0000,
      "inq_infielddate": "2025-08-15",
      "inq_medicalreview": false,
      "inq_latinnamesuffix": null,
      "inq_totalunreversedchargesamount": 0.0000000000,
      "inq_housingcharge": null,
      "inq_image_url": "/Image/download.aspx?Entity=inq_missionary&Attribute=inq_image&Id=a106e921-ee4d-f011-8779-000d3a3113ca&Timestamp=638860314640984689",
      "inq_totalunreversedcharges": 0,
      "inq_callletterlanguage1": null,
      "inq_calculatedtaxyearenddate": "2025-05-31",
      "_inq_spouseid_value": null,
      "inq_assignmentdetailsreport": null,
      "inq_housingchargeholder": null,
      "inq_homeaddresscountry": null
    }
  ]
};

export default function INQMissionariesPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(INQ_ENVIRONMENTS[0]);
  const [queryUrl, setQueryUrl] = useState('inq_missionaries?$top=10');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [showSample, setShowSample] = useState(false);

  const buildFullUrl = () => {
    return `${selectedEnvironment.baseUrl}/${queryUrl}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const executeQuery = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      // Note: This is a mock implementation since we don't have actual OAuth2 flow for INQ
      // In a real implementation, you would need to authenticate with the Dataverse API
      setResponse('⚠️ Query execution requires proper OAuth2 authentication with Microsoft Dataverse.\n\nTo execute this query, you would need to:\n1. Authenticate using the client credentials above\n2. Obtain an access token from Azure AD\n3. Include the token in the Authorization header\n4. Make the HTTP request to the OData endpoint\n\nExample response structure is shown in the sample data below.');
    } catch (error) {
      setResponse(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📊</span>
        <h1 className="text-2xl font-bold">INQ Missionaries</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">OData Web API</span>
      </div>

      {/* Environment Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {INQ_ENVIRONMENTS.map((env) => (
            <button
              key={env.name}
              onClick={() => setSelectedEnvironment(env)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedEnvironment.name === env.name
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-lg">{env.name}</div>
              <div className="text-sm text-gray-600 mt-1">{env.description}</div>
            </button>
          ))}
        </div>

        {/* Selected Environment Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Authentication Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 font-medium">Base URL:</label>
              <div className="font-mono bg-white p-2 rounded border">{selectedEnvironment.baseUrl}</div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Client ID:</label>
              <div className="font-mono bg-white p-2 rounded border flex items-center justify-between">
                <span>{selectedEnvironment.clientId}</span>
                <button
                  onClick={() => copyToClipboard(selectedEnvironment.clientId)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Scope:</label>
              <div className="font-mono bg-white p-2 rounded border">{selectedEnvironment.scope}</div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Client Secret:</label>
              <div className="font-mono bg-white p-2 rounded border text-gray-400">my-secret (hidden)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Builder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">OData Query</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OData Query Path:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={queryUrl}
                onChange={(e) => setQueryUrl(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="inq_missionaries?$top=10"
              />
              <button
                onClick={() => copyToClipboard(buildFullUrl())}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Copy full URL"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Query Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Examples:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { name: 'Top 10', query: 'inq_missionaries?$top=10' },
                { name: 'By Missionary Number', query: "inq_missionaries?$filter=inq_missionarynumber eq '202139'" },
                { name: 'Select Key Fields', query: 'inq_missionaries?$select=inq_name,inq_missionarynumber,inq_calculatedstatus&$top=5' },
                { name: 'In-field Status', query: "inq_missionaries?$filter=inq_calculatedstatus eq 'In-field'&$top=5" },
                { name: 'Order by Name', query: 'inq_missionaries?$orderby=inq_name&$top=5' },
                { name: 'Recent Start Dates', query: 'inq_missionaries?$filter=inq_startdate ge 2025-01-01&$orderby=inq_startdate desc&$top=5' }
              ].map((example) => (
                <button
                  key={example.name}
                  onClick={() => setQueryUrl(example.query)}
                  className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs"
                >
                  <div className="font-medium text-blue-600">{example.name}</div>
                  <div className="font-mono text-gray-600 truncate">{example.query}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Full URL:</div>
            <div className="font-mono text-sm bg-white p-2 rounded border break-all">{buildFullUrl()}</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={executeQuery}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4" />
              {isLoading ? 'Executing...' : 'Execute Query'}
            </button>
            
            <button
              onClick={() => setShowSample(!showSample)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4" />
              {showSample ? 'Hide' : 'Show'} Sample Data
            </button>
          </div>
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response</h2>
          <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto whitespace-pre-wrap">
            {response}
          </pre>
        </div>
      )}

      {/* Sample Data */}
      {showSample && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Response Data</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(SAMPLE_MISSIONARY, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">📚 INQ Dataverse API Documentation</h2>
        
        <div className="space-y-4 text-blue-800 text-sm">
          <div>
            <h3 className="font-semibold mb-2">🔐 Authentication</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Uses OAuth 2.0 Client Credentials flow</li>
              <li>Authenticate with Microsoft Azure AD</li>
              <li>Include access token in Authorization header: <code className="bg-blue-100 px-1 rounded">Bearer &lt;token&gt;</code></li>
              <li>Different client IDs for each environment (Prod has unique client ID)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🌐 OData Web API</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Standard OData v4.0 query syntax</li>
              <li>Base endpoint: <code className="bg-blue-100 px-1 rounded">/api/data/v9.2/</code></li>
              <li>Entity set: <code className="bg-blue-100 px-1 rounded">inq_missionaries</code></li>
              <li>Supports $filter, $select, $expand, $top, $skip, $orderby</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📊 Key Fields</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>inq_missionaryid:</strong> Unique missionary identifier</li>
              <li><strong>inq_missionarynumber:</strong> Public missionary number</li>
              <li><strong>inq_name:</strong> Full name (Last, First Middle)</li>
              <li><strong>inq_legacycmisid:</strong> Legacy CMIS ID for integration</li>
              <li><strong>inq_calculatedstatus:</strong> Current missionary status</li>
              <li><strong>inq_startdate / inq_calculatedreleasedate:</strong> Service dates</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🔍 Example Queries</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$top=10</code> - Get first 10 missionaries</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$filter=inq_missionarynumber eq '202139'</code> - Find by missionary number</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$select=inq_name,inq_missionarynumber,inq_calculatedstatus</code> - Select specific fields</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$filter=inq_calculatedstatus eq 'In-field'</code> - Filter by status</li>
              <li><code className="bg-blue-100 px-1 rounded">inq_missionaries?$orderby=inq_startdate desc</code> - Order by start date</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📡 HTTP Request Example</h3>
            <div className="bg-blue-100 rounded p-3 font-mono text-xs">
              <div className="mb-2"><strong>GET</strong> {selectedEnvironment.baseUrl}/inq_missionaries?$top=10</div>
              <div><strong>Headers:</strong></div>
              <div className="ml-4">Authorization: Bearer &lt;access_token&gt;</div>
              <div className="ml-4">Accept: application/json</div>
              <div className="ml-4">OData-MaxVersion: 4.0</div>
              <div className="ml-4">OData-Version: 4.0</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🏢 Environments</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Dev:</strong> Development and integration testing</li>
              <li><strong>Test:</strong> Quality assurance and validation</li>
              <li><strong>Stage:</strong> Pre-production staging environment</li>
              <li><strong>Prod:</strong> Production environment with live data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
