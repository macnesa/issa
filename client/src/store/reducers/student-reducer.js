import {LOADING, FETCH_SCHEDULE, FETCH_STATUS ,  FETCH_CLASSMATE, FETCH_STUDENT_DETAIL, FETCH_CLASS_SCHEDULE, FETCH_ACTIVIY, FETCH_SPP, FETCH_STATISTIC } from '../actions/actionTypes'

let initialState = {
    schedule: [],
    classmate: [],
    studentDetail: "",
    classSchedule: [],
    activiy: [],
    SPP: [],
    statistic: [],
    casts: [],
    status: [],
    loading: false,
    error: null
}

export default function reducer(state = initialState, action) {

    switch (action.type) {
        case LOADING:
            return {
                ...state,
                loading: true
            }
        case FETCH_SCHEDULE:
            return {
                ...state,
                schedule: action.payload
            }

        case FETCH_CLASSMATE:
            return {
                ...state,
                classmate: action.payload
            }

        case FETCH_STUDENT_DETAIL:
            return {
                ...state,
                loading: false,
                studentDetail: action.payload
            }

        case FETCH_CLASS_SCHEDULE:
            return {
                ...state,
                classSchedule: action.payload
            }

        case FETCH_ACTIVIY:
            return {
                ...state,
                activiy: action.payload
            }

        case FETCH_SPP:
            return {
                ...state,
                SPP: action.payload
            }

        case FETCH_STATISTIC:
            return {
                ...state,
                statistic: action.payload
            } 
        case FETCH_STATUS:
            return {
                ...state,
                status: action.payload
            }

        default:
            return state
    }
}