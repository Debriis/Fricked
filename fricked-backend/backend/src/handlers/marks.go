package handlers

import (
	"fricked-backend/src/helpers"
	"fricked-backend/src/types"
)

func GetMarks(token string) (*types.MarksResponse, error) {
	scraper := helpers.NewAcademicsFetch(token)
	marks, err := scraper.GetMarks()

	return marks, err

}
