package handlers

import (
	"fricked-backend/src/helpers"
	"fricked-backend/src/types"
)

func GetUser(token string) (*types.User, error) {
	scraper := helpers.NewCoursePage(token)
	page, err := scraper.GetPage()
	if err != nil {
		return &types.User{}, err
	}

	user, err := helpers.GetUser(page)

	return user, err

}
