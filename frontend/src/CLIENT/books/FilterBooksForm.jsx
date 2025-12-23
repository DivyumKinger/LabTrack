import React, { useState, useEffect } from 'react'
import { backend_server } from '../../config'
import axios from 'axios'

import './filterbooksform.css'

const FilterBooksForm = ({ setBookData, setSearchResult, setFilterActive }) => {
  const API_URL_FILTER = `${backend_server}/api/v1/filter`
  const API_ALLBOOKS_URL = `${backend_server}/api/v1/books`
  const API_CATEGORY_URL = `${backend_server}/api/v1/book_category`

  const empty_field = {
    title: '',
    category: '',
    author: '',
    language: '',
  }

  const [filterFields, setFilterFields] = useState(empty_field) //Filter FORM Fields Data
  const [categories, setCategories] = useState([]) //all books CATEGORIES
  const [author, setAuthor] = useState([])
  const [language, setLanguage] = useState([])

  // Form Submit handle (FILTER data Fetched)
  const handleFormSubmit = async (e) => {
    e.preventDefault()

    // Checking if user falsly hit search without making any changes
    // this fixes -> empty fields search means fetching all data which we dont want
    if (JSON.stringify(filterFields) === JSON.stringify(empty_field)) {
      return setFilterActive(false)
    }
    setFilterActive(true)

    const { title, category, author, language } = filterFields
    try {
      const response = await axios.get(API_URL_FILTER, {
        params: {
          title,
          category,
          author,
          language,
        },
      })

      let totalHits = response.data.total
      if (totalHits == 0) {
        setSearchResult(false)
      }

      setBookData(response.data.data)
    } catch (error) {
      console.log(error)
      console.log(error.response)
    }
  }

  // FORM INPUT FIELDS On Change Handlers
  const handleSearchTitleOnChange = (e) => {
    const { name, value } = e.target
    setFilterFields({ ...filterFields, [name]: value })
  }
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value
    setFilterFields({ ...filterFields, category: selectedCategory })
  }
  const handleAuthorChange = (e) => {
    const selectedAuthor = e.target.value
    setFilterFields({ ...filterFields, author: selectedAuthor })
  }
  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value
    setFilterFields({ ...filterFields, language: selectedLanguage })
  }

  // Fetch ALL Book Categories
  const fetchAllCategories = async () => {
    try {
      const response = await axios.get(API_CATEGORY_URL);
      // Ensure that we always set an array to prevent .map errors
      setCategories(response.data.data || []);
    } catch (error) {
      console.log('Error fetching categories:', error);
      // In case of error, ensure state is a safe value (empty array)
      setCategories([]);
    }
  }

  // Fetch ALL Authors and Languages (still inefficient, but separated)
  const fetchAuthorsAndLanguages = async () => {
    try {
      const response = await axios.get(API_ALLBOOKS_URL)
      // Guard clause to ensure we have an array to map over
      if (Array.isArray(response.data.data)) {
        const bookAuthor = [
          ...new Set(response.data.data.map((author_para) => author_para.author)),
        ]
        const bookLanguage = [
          ...new Set(response.data.data.map((language_para) => language_para.language)),
        ]
        setAuthor(bookAuthor)
        setLanguage(bookLanguage)
      } else {
        // In case of unexpected response, ensure states are safe values
        setAuthor([])
        setLanguage([])
      }
    } catch (error) {
      console.log(error.response)
      setAuthor([])
      setLanguage([])
    }
  }

  useEffect(() => {
    fetchAllCategories()
    fetchAuthorsAndLanguages()
  }, [])

  // Clears the FORM value and Filter
  const handleClearFilter = () => {
    setFilterFields(empty_field)
    // No need to clear and refetch, the data is already there
  }

  return (
    <div className='container '>
      <div className='row my-3 justify-content-center'>
        <div className='col-md-8'>
          <form method='get' className='form-inline d-flex'>
            {/* Search Filter */}
            <div className='form-group mx-1 my-1  col-xl-4'>
              <input
                type='text'
                className='form-control mx-1'
                autoComplete='off'
                placeholder='Search by title . . .'
                name='title'
                value={filterFields.title}
                onChange={handleSearchTitleOnChange}
              />
            </div>

            {/* Category Filter */}
            <div className='form-group mx-1 my-1 col-xl-2'>
              <select
                className='form-control mx-1'
                value={filterFields.category}
                onChange={handleCategoryChange}
              >
                <option value=''>
                  Categories
                </option>
                {categories.map((books_category) => {
                  return (
                    <option key={books_category} value={books_category}>
                      {books_category}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Author Filter */}
            <div className='form-group mx-1 my-1 col-xl-2'>
              <select
                className='form-control mx-1'
                value={filterFields.author}
                onChange={handleAuthorChange}
              >
                <option value=''>
                  Author
                </option>
                {author.map((books_author) => {
                  return (
                    <option key={books_author} value={books_author}>
                      {books_author}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Language Filter */}
            <div className='form-group mx-1 my-1 col-xl-2'>
              <select
                className='form-control mx-1'
                value={filterFields.language}
                onChange={handleLanguageChange}
              >
                <option value=''>
                  Language
                </option>
                {language.map((books_language) => {
                  return (
                    <option key={books_language} value={books_language}>
                      {books_language.toUpperCase()}
                    </option>
                  )
                })}
              </select>
            </div>

            <div
              className='col-xl-2 d-flex text-center '
              style={{ width: 'fit-content' }}
            >
              <button
                type='submit'
                className='btn btn-success mx-1 my-1 '
                onClick={handleFormSubmit}
              >
                Search
              </button>
              <button
                type='button'
                className='btn btn-danger mx-1 my-1'
                onClick={handleClearFilter}
              >
                Clear Filter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FilterBooksForm
