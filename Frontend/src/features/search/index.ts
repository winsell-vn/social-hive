// Components
export { SearchBar } from './components/SearchBar'
export { SearchResults } from './components/SearchResults'
export { TrendingHashtags } from './components/TrendingHashtags'

// API hooks
export {
  searchKeys,
  useSearch,
  useSearchSuggestions,
  useTrendingHashtags,
} from './api/search'

// Types
export type {
  SearchType,
  SearchUser,
  SearchHashtag,
  SearchGroup,
  SearchResults as SearchResultsType,
  SearchSuggestions,
  TrendingHashtag,
} from './types/search'

