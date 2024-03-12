export type Movie =   {
  id: number,
  backdrop_path: string,
  genre_ids: number[ ],
  original_language: string,
  original_title: string,
  adult: boolean,
  overview: string,
  popularity: number,
  poster_path: string,
  release_date: string,
  title: string,
  video: boolean,
  vote_average: number,
  vote_count: number
}
export type MovieReviews = {
  // id: number;
  movieId: number;
  reviewerName: string;
  reviewDate: string;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
};
// Used to validate the query string og HTTP Get requests
export type MovieReviewsQueryParams = {
  movieId: string;
  reviewerName?: string;
  rating?: number;
}


