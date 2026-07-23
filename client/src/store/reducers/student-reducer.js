import { FETCH_SCHEDULE, FETCH_STATUS, FETCH_SPP, FETCH_STATISTIC, STUDENT_DETAIL_REQUEST, STUDENT_DETAIL_SUCCESS, STUDENT_DETAIL_FAILURE, CLASSMATE_REQUEST, CLASSMATE_SUCCESS, CLASSMATE_FAILURE, CLASS_SCHEDULE_REQUEST, CLASS_SCHEDULE_SUCCESS, CLASS_SCHEDULE_FAILURE, ACTIVITY_REQUEST, ACTIVITY_SUCCESS, ACTIVITY_FAILURE, RESET_PARENT_SESSION } from '../actions/actionTypes'
import { emptyStudentOverview } from '../../mappers/studentDetail'

const createResourceState = (resourceData) => ({ data: resourceData, loading: false, loaded: false, error: null });

const createInitialStudentState = () => ({
    schedule: [],
    classmate: createResourceState([]),
    studentDetail: createResourceState(emptyStudentOverview()),
    classSchedule: createResourceState([]),
    activity: createResourceState([]),
    SPP: [],
    statistic: [],
    casts: [],
    status: [],
});

const initialState = createInitialStudentState();

export default function studentReducer(state = initialState, action) {

    switch (action.type) {
        case STUDENT_DETAIL_REQUEST:
            return {
                ...state,
                studentDetail: { ...state.studentDetail, loading: true, error: null }
            }
        case FETCH_SCHEDULE:
            return {
                ...state,
                schedule: action.payload
            }

        case CLASSMATE_REQUEST:
            return {
                ...state,
                classmate: { ...state.classmate, loading: true, error: null }
            }

        case CLASSMATE_SUCCESS:
            return {
                ...state,
                classmate: { data: action.payload, loading: false, loaded: true, error: null }
            }

        case CLASSMATE_FAILURE:
            return {
                ...state,
                classmate: { ...state.classmate, loading: false, loaded: true, error: action.payload }
            }

        case STUDENT_DETAIL_SUCCESS:
            return {
                ...state,
                studentDetail: { data: action.payload, loading: false, loaded: true, error: null }
            }

        case STUDENT_DETAIL_FAILURE:
            return {
                ...state,
                studentDetail: { ...state.studentDetail, loading: false, loaded: true, error: action.payload }
            }

        case CLASS_SCHEDULE_REQUEST:
            return { ...state, classSchedule: { ...state.classSchedule, loading: true, error: null } }

        case CLASS_SCHEDULE_SUCCESS:
            return { ...state, classSchedule: { data: action.payload, loading: false, loaded: true, error: null } }

        case CLASS_SCHEDULE_FAILURE:
            return { ...state, classSchedule: { ...state.classSchedule, loading: false, loaded: true, error: action.payload } }

        case ACTIVITY_REQUEST:
            return { ...state, activity: { ...state.activity, loading: true, error: null } }

        case ACTIVITY_SUCCESS:
            return { ...state, activity: { data: action.payload, loading: false, loaded: true, error: null } }

        case ACTIVITY_FAILURE:
            return { ...state, activity: { ...state.activity, loading: false, loaded: true, error: action.payload } }

        case RESET_PARENT_SESSION:
            return createInitialStudentState()

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
