import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  date: string;
  location?: string;
}

// Actual 5-star reviews from NextDoor Exterior Solutions Google Business Profile
const reviews: Review[] = [
  {
    id: 1,
    name: "Vicente",
    rating: 5,
    text: "Drew the owner was awesome. Jim the salesman was awesome and explained everything and kept in touch of the steps of the roof. Great communication with every step. His crew is great and did an awesome job on my metal roof. It's so much cooler in the house now and looks beautiful!",
    date: "3 weeks ago",
    location: "Florida"
  },
  {
    id: 2,
    name: "Guillermo",
    rating: 5,
    text: "We had such a great experience with this roofing company! The process was smooth from start to finish. The team communicated clearly and kept us informed the whole way through. When they came in, they got straight to work and were professional.",
    date: "6 months ago",
    location: "Florida"
  },
  {
    id: 3,
    name: "Janet",
    rating: 5,
    text: "We live in Spring Hill and were in desperate need of a new roof. Kyle showed up at our door. One of the best days of our life. Kyle made the whole process of getting a new roof so easy for us. The owners are easy to work with. The roofers did excellent work.",
    date: "a year ago",
    location: "Spring Hill, FL"
  },
  {
    id: 4,
    name: "James",
    rating: 5,
    text: "Their vision is simple - Affordable roofs with the highest quality & helping people with no insurance throughout the Tampa Bay area! Including many finance programs available. The owners Drew & Alex have what this industry needs - Integrity, transparency & accountability!",
    date: "a month ago",
    location: "Tampa Bay, FL"
  },
  {
    id: 5,
    name: "Malena",
    rating: 5,
    text: "NextDoor Exterior Solutions did an outstanding and professional roofing job on my house. They walked me through everything and the office manager Chris was very patient answering all of my questions and concerns. The crew were punctual and professional.",
    date: "7 months ago",
    location: "Florida"
  },
  {
    id: 6,
    name: "Kim",
    rating: 5,
    text: "I was impacted by Hurricane Milton. Then I met Josh and we talked for some time before I agreed to have NextDoor Exterior Solutions replace my roof. Josh and Drew made the process smooth and stress-free, especially given the challenges with the hurricane damage.",
    date: "6 months ago",
    location: "Florida"
  },
  {
    id: 7,
    name: "Andrew",
    rating: 5,
    text: "Jim Musella referred us to NextDoor Exterior Solutions, very glad! We have now begun the process of receiving a new roof. He has followed up with me and helped with any questions I have had along the way and been very supportive. Thank you Jim!",
    date: "2 weeks ago",
    location: "Florida"
  },
  {
    id: 8,
    name: "J.",
    rating: 5,
    text: "NextDoor Exterior Solutions just installed our new roof. Chad Graves was the salesman. He worked with us and then the insurance adjuster to make sure the extent of the damage and age of the roof was well documented. Excellent service!",
    date: "a year ago",
    location: "Florida"
  }
];

export function GoogleReviewsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="h-8 w-8" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-white text-xl font-semibold">Google Reviews</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 text-primary">
            <div className="flex">{renderStars(5)}</div>
            <span className="text-white font-semibold">4.8</span>
            <span className="text-gray-400">(79 reviews)</span>
          </div>
        </div>

        {/* Reviews Slider */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-primary/20 hover:bg-primary/40 text-white rounded-full h-12 w-12"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-primary/20 hover:bg-primary/40 text-white rounded-full h-12 w-12"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Review Card */}
          <div className="overflow-hidden px-8">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {reviews.map((review) => (
                <div key={review.id} className="w-full flex-shrink-0 px-4">
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 mx-auto max-w-2xl">
                    <CardContent className="p-8">
                      <Quote className="h-10 w-10 text-primary/50 mb-4" />
                      <p className="text-white text-lg md:text-xl leading-relaxed mb-6">
                        "{review.text}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex mb-2">{renderStars(review.rating)}</div>
                          <p className="text-white font-semibold">{review.name}</p>
                          {review.location && (
                            <p className="text-gray-400 text-sm">{review.location}</p>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm">{review.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        </div>

        {/* View All Reviews Link */}
        <div className="text-center mt-8">
          <a
            href="https://www.google.com/search?q=NextDoor+Exterior+Solutions+reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            View all 79 reviews on Google →
          </a>
        </div>
      </div>
    </section>
  );
}
