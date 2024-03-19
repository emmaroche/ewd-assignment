export type MovieReviews = {
  movieId: number;
  reviewerName: string;
  reviewDate: string;
  content: string;
  // Reference I used for setting range on the rating between 1 - 5: https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range
  rating: 1 | 2 | 3 | 4 | 5;
};
// Used to validate the query string og HTTP Get requests
export type MovieReviewsQueryParams = {
  movieId: string;
  reviewerName?: string;
  reviewDate?: string;
}

// Auth
export type SignUpBody = {
  username: string;
  password: string;
  email: string
}

export type ConfirmSignUpBody = {
  username: string;
  code: string;
}

export type SignInBody = {
  username: string;
  password: string;
}