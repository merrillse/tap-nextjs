import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MOGSAssignmentLocationPage from '../../app/mogs-assignment-location/page'
import { mockValidAssignmentLocation, mockApiClient, mockEnvironments } from '../mocks/assignmentLocationMocks'

// Mock the API client and environments
vi.mock('../../lib/api-client', () => ({
  ApiClient: vi.fn().mockImplementation(() => mockApiClient)
}))

vi.mock('../../lib/environments', () => ({
  ENVIRONMENTS: mockEnvironments
}))

describe('MOGS Assignment Location Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Component Rendering', () => {
    it('should render the page title and header correctly', () => {
      render(<MOGSAssignmentLocationPage />)
      
      expect(screen.getByRole('heading', { name: /MOGS Assignment Location/i })).toBeInTheDocument()
      expect(screen.getByText('Missionary Oracle Graph Service')).toBeInTheDocument()
      expect(screen.getByText('🏢')).toBeInTheDocument()
    })

    it('should render environment selector with correct options', () => {
      render(<MOGSAssignmentLocationPage />)
      
      const environmentSelect = screen.getByLabelText(/environment/i)
      expect(environmentSelect).toBeInTheDocument()
      expect(screen.getByDisplayValue('MOGS Development')).toBeInTheDocument()
      
      fireEvent.click(environmentSelect)
      expect(screen.getByText('MOGS Local')).toBeInTheDocument()
      expect(screen.getByText('MOGS Production')).toBeInTheDocument()
    })

    it('should render search form with input and buttons', () => {
      render(<MOGSAssignmentLocationPage />)
      
      expect(screen.getByLabelText(/Assignment Location ID/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('should show connection status indicator', async () => {
      render(<MOGSAssignmentLocationPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })
    })
  })

  describe('Input Validation', () => {
    it('should show error when searching with empty input', async () => {
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please enter an Assignment Location ID')).toBeInTheDocument()
      })
    })

    it('should trim whitespace from input', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '  12345  ')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(mockApiClient.executeGraphQLQuery).toHaveBeenCalledWith(
          expect.any(String),
          { id: '  12345  ' }
        )
      })
    })

    it('should disable search button when loading', async () => {
      mockApiClient.executeGraphQLQuery.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      expect(screen.getByRole('button', { name: /searching.../i })).toBeDisabled()
    })
  })

  describe('API Integration', () => {
    it('should make correct GraphQL query with valid input', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(mockApiClient.executeGraphQLQuery).toHaveBeenCalledWith(
          expect.stringContaining('query GetAssignmentLocation'),
          { id: '12345' }
        )
      })
    })

    it('should handle successful API response', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()
        expect(screen.getByText('Test Mission Brazil')).toBeInTheDocument()
        expect(screen.getByText('Brazil Sao Paulo Mission')).toBeInTheDocument()
      })
    })

    it('should handle API error gracefully', async () => {
      mockApiClient.executeGraphQLQuery.mockRejectedValueOnce(
        new Error('Network error: Failed to fetch')
      )
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Network error: Failed to fetch')).toBeInTheDocument()
      })
    })

    it('should handle not found response', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: null }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, 'nonexistent')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('No assignment location found with ID: nonexistent')).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    beforeEach(async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValue({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
    })

    it('should display basic assignment location information', async () => {
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('12345')).toBeInTheDocument()
        expect(screen.getByText('Test Mission Brazil')).toBeInTheDocument()
        expect(screen.getByText('Brazil Sao Paulo Mission')).toBeInTheDocument()
        expect(screen.getByText('ACTIVE')).toBeInTheDocument()
        expect(screen.getByText('MISSION')).toBeInTheDocument()
      })
    })

    it('should display organization information', async () => {
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Brazil Sao Paulo Mission')).toBeInTheDocument()
        expect(screen.getByText('BSP Mission')).toBeInTheDocument()
      })
    })

    it('should display numerical data correctly', async () => {
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // complement
        expect(screen.getByText('30')).toBeInTheDocument()  // maxTransfer
        expect(screen.getByText('250')).toBeInTheDocument() // bikeCost
      })
    })

    it('should handle missing optional data gracefully', async () => {
      const minimalLocation = {
        id: '12345',
        name: 'Minimal Location'
      }
      
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: minimalLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Minimal Location')).toBeInTheDocument()
        const naElements = screen.getAllByText('N/A')
        expect(naElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('User Interactions', () => {
    it('should allow searching by pressing Enter key', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345{enter}')
      
      await waitFor(() => {
        expect(mockApiClient.executeGraphQLQuery).toHaveBeenCalled()
      })
    })

    it('should clear input and results when clear button is clicked', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()
      })
      
      await user.click(screen.getByRole('button', { name: /clear/i }))
      
      expect(input).toHaveValue('')
      expect(screen.queryByText('Assignment Location Details')).not.toBeInTheDocument()
    })

    it('should allow environment switching', async () => {
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const environmentSelect = screen.getByLabelText(/environment/i)
      await user.selectOptions(environmentSelect, 'mogs-gql-local')
      
      expect(screen.getByDisplayValue('MOGS Local')).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    it('should show export button when data is loaded', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
      })
    })

    it('should trigger download when export button is clicked', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      // Mock URL.createObjectURL and other download-related functions
      const mockCreateObjectURL = vi.fn(() => 'mock-blob-url')
      const mockRevokeObjectURL = vi.fn()
      const mockClick = vi.fn()
      
      Object.defineProperty(window, 'URL', {
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL
        }
      })
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      }
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
      })
      
      await user.click(screen.getByRole('button', { name: /export json/i }))
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Search History', () => {
    it('should save successful searches to history', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem')
      
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'mogs-assignment-location-search-history',
          expect.stringContaining('12345')
        )
      })
    })

    it('should load search history from localStorage on mount', () => {
      const mockHistory = JSON.stringify([
        {
          id: '1',
          assignmentLocationId: '12345',
          timestamp: new Date().toISOString(),
          resultFound: true,
          assignmentLocationName: 'Test Location'
        }
      ])
      
      vi.spyOn(localStorage, 'getItem').mockReturnValue(mockHistory)
      
      render(<MOGSAssignmentLocationPage />)
      
      expect(screen.getByText('📜 Search History')).toBeInTheDocument()
      expect(screen.getByText('Assignment Location ID: 12345')).toBeInTheDocument()
    })

    it('should allow clicking on history entries to reload searches', async () => {
      const mockHistory = JSON.stringify([
        {
          id: '1',
          assignmentLocationId: '67890',
          timestamp: new Date().toISOString(),
          resultFound: true,
          assignmentLocationName: 'History Location'
        }
      ])
      
      vi.spyOn(localStorage, 'getItem').mockReturnValue(mockHistory)
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const historyEntry = screen.getByText('Assignment Location ID: 67890')
      await user.click(historyEntry.closest('div')!)
      
      const input = screen.getByLabelText(/Assignment Location ID/i) as HTMLInputElement
      expect(input.value).toBe('67890')
    })
  })
})
