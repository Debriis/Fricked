package handlers

import (
	"fricked-backend/src/helpers"
	"fricked-backend/src/types"
)

func GetAttendance(token string) (*types.AttendanceResponse, error) {
	scraper := helpers.NewAcademicsFetch(token)
	attendance, err := scraper.GetAttendance()

	return attendance, err

}
