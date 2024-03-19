import { MovieReviews } from '../shared/types'

export const reviews: MovieReviews[] = [
    {
        movieId: 1234,
        reviewerName: "John Doe",
        reviewDate: "2023-10-10",
        content: "This is a great movie",
        rating: 5
    },
    {
        movieId: 2345,
        reviewerName: "Jane Doe",
        reviewDate: "2023-10-20",
        content: "This is a bad movie",
        rating: 1
    },
    {
        movieId: 3456,
        reviewerName: "Alice Smith",
        reviewDate: "2023-11-05",
        content: "I loved this movie so much!",
        rating: 5
    },
    {
        movieId: 4567,
        reviewerName: "Peter McGrath",
        reviewDate: "2024-03-15",
        content: "This movie was meh, it didn't quite live up to the hype for me.",
        rating: 2
    },
    {
        movieId: 5678,
        reviewerName: "Emily Walsh",
        reviewDate: "2024-03-25",
        content: "I found this movie fantastic. Highly recommended.",
        rating: 4
    }
];