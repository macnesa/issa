
export const LOADING = "LOADING"

export const COUNTER_INCREMENTER = "a/b"

export const READ_PRODUCTS = "READ_PRODUCTS"

export const WRITE_PRODUCTS = "WRITE_PRODUCTS"

export const WRITE_PRODUCT = "WRITE_PRODUCT"
export const WRITE_PRODUCT_FAILED = "WRITE_PRODUCT_FAILED"

export const WRITE_PRODUCTS_BY_TYPE = "WRITE_PRODUCT_BY_TYPE"


export const WRITE_CATEGORIES = "WRITE_CATEGORIES"
export const WRITE_CATEGORIES_FAILED = "WRITE_CATEGORIES_FAILED"


export const UPDATE_PRODUCT = "UPDATE_PRODUCT"

export const UPDATE_PRODUCT_IMAGEVALUE = "UPDATE_PRODUCT_IMAGEVALUE"


export const WRITE_LESSON = "WRITE_LESSON"













export const FETCH_SCHEDULE = (type) => {
  return `SCHEDULE/fetchAll`
}

export const FETCH_CLASSMATE = (type) => {
  return `CLASSMATE/fetchAll`
}

export const FETCH_STUDENT_DETAIL = (type) => {
  return `STUDENT_DETAIL/fetchAll`
}

export const FETCH_CLASS_SCHEDULE = (type) => {
  return `SCHEDULE_CLASS/fetchAll`
}

export const FETCH_ACTIVITY = (type) => {
  return `ACTIVITY/fetchAll`
}

export const FETCH_SPP = (type) => {
  return `SPP/fetchAll`
}

export const FETCH_STATISTIC = (type) => {
  return `STATISTIC/fetchAll`
}

export const FETCH_STATUS = (type) => {
  return `STATUS/fetchAll`
}

export const STUDENT_DETAIL_REQUEST = 'STUDENT_DETAIL/request';
export const STUDENT_DETAIL_SUCCESS = 'STUDENT_DETAIL/success';
export const STUDENT_DETAIL_FAILURE = 'STUDENT_DETAIL/failure';
export const CLASSMATE_REQUEST = 'CLASSMATE/request';
export const CLASSMATE_SUCCESS = 'CLASSMATE/success';
export const CLASSMATE_FAILURE = 'CLASSMATE/failure';
export const CLASS_SCHEDULE_REQUEST = 'SCHEDULE_CLASS/request';
export const CLASS_SCHEDULE_SUCCESS = 'SCHEDULE_CLASS/success';
export const CLASS_SCHEDULE_FAILURE = 'SCHEDULE_CLASS/failure';
export const ACTIVITY_REQUEST = 'ACTIVITY/request';
export const ACTIVITY_SUCCESS = 'ACTIVITY/success';
export const ACTIVITY_FAILURE = 'ACTIVITY/failure';
export const RESET_PARENT_SESSION = 'PARENT_SESSION/reset';
