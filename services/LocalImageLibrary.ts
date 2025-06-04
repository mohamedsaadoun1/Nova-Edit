/**
 * Local Image Library - بديل محلي لـ Pixabay API
 * مكتبة صور محلية مجانية بدون الحاجة لإنترنت أو مفاتيح API
 */

export interface LocalImage {
  id: string;
  name: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  description: string;
  license: 'free' | 'cc0';
}

export interface ImageSearchResult {
  items: LocalImage[];
  total: number;
  hasMore: boolean;
}

export class LocalImageLibrary {
  private images: LocalImage[] = [
    // صور الطبيعة
    {
      id: 'nature_001',
      name: 'Sunset Forest',
      category: 'nature',
      tags: ['forest', 'sunset', 'trees', 'landscape'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAABAUCAwYBB//EAC4QAAIBAwMCBQIGAwAAAAAAAAECAwAEEQUSITFBBhMiUWEUcYGRobHB8AcVMv/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A5ik+6j6vpuIZAQg6YOK0SbWPCNg4JxuxWj6zTdMLPbR22Pq4lbc6nIOe9ZDVfEM99eyNJJ50acIcDCigaXVzqV4+uyXMksUqTkZOWJ6YFbXTruWTwqklz9RNLZsSSzbMYOexPFZPUrqW5v7qSSVi0hABJ7CoWz3MtzFH5zBZCqkE+9BqNT8Sp9OIorG3jU9QaIbrXxLdttgsr6QY2kAAVST7YxRNjqmoaf4gQPBKB5gMhwOgNNNM8SavKzC5e7jzywDYGadanqLavoIurO4gJLBJJnOAsJONynrjpmgdx/4+h+mjXUrqSG5zjIRNpBz+fxWj8MeFfAmo2rXfgqEXczNhxLJJujb/AKCHrnPftWe8Ua1L9E9vHdXk80cJwkUpbBHOSPetbqR1VfCmn6vHCqjy9z7u4FAtHgJY/FUjau5ktyQJJGOTnO7rT5PCfgS+0qb6qzuZiIWJUrJIGCkYYZPtUfEOveINR1M2+kWzWUYRSeJl+mJz3K9d3TrxR58aX72d3Y6npWkTxCa0Myhr7b5AZQM7F6+5oFOm6DoPiT/HWqWWj2MenaxYYFtdO+9JGBAJUNjDgdcr/FMjqSacFg8T6bq0dzOQFsLPJOWPDDd+oqmlRat4Z8WR6RYWrWj3LMLeEJKGjeTbgLvAwT7VoeIbhpviXps0gTdP5sgOTz1IzQUtasDwpe+Irpfs82n2cNykyiIGONFywO4D7u0nFR8TaT4g0ywjHim/S4tbsxLE8cLTFYNu5AQx3DOwjpUPGXi++h8JGz0WOzjvQxEU9qjr/wCgAl3AYDfmhvDmp31zY3vge7eISXkKXFlcvs5bOQjdz6hx96D/2Q==',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAABAUCAwYBB//EAC4QAAIBAwMCBQIGAwAAAAAAAAECAwAEEQUSITFBBhMiUWEUcYGRobHB8AcVMv/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A5ik+6j6vpuIZAQg6YOK0SbWPCNg4JxuxWj6zTdMLPbR22Pq4lbc6nIOe9ZDVfEM99eyNJJ50acIcDCigaXVzqV4+uyXMksUqTkZOWJ6YFbXTruWTwqklz9RNLZsSSzbMYOexPFZPUrqW5v7qSSVi0hABJ7CoWz3MtzFH5zBZCqkE+9BqNT8Sp9OIorG3jU9QaIbrXxLdttgsr6QY2kAAVST7YxRNjqmoaf4gQPBKB5gMhwOgNNNM8SavKzC5e7jzywDYGadanqLavoIurO4gJLBJJnOAsJONynrjpmgdx/4+h+mjXUrqSG5zjIRNpBz+fxWj8MeFfAmo2rXfgqEXczNhxLJJujb/AKCHrnftWe8Ua1L9E9vHdXk80cJwkUpbBHOSPetbqR1VfCmn6vHCqjy9z7u4FAtHgJY/FUjau5ktyQJJGOTnO7rT5PCfgS+0qb6qzuZiIWJUrJIGCkYYZPtUfEOveINR1M2+kWzWUYRSeJl+mJz3K9d3TrxR58aX72d3Y6npWkTxCa0Myhr7b5AZQM7F6+5oFOm6DoPiT/HWqWWj2MenaxYYFtdO+9JGBAJUNjDgdcr/FMjqSacFg8T6bq0dzOQFsLPJOWPDDd+oqmlRat4Z8WR6RYWrWj3LMLeEJKGjeTbgLvAwT7VoeIbhpviXps0gTdP5sgOTz1IzQUtasDwpe+Irpfs82n2cNykyiIGONFywO4D7u0nFR8TaT4g0ywjHim/S4tbsxLE8cLTFYNu5AQx3DOwjpUPGXi++h8JGz0WOzjvQxEU9qjr/wCgAl3AYDfmhvDmp31zY3vge7eISXkKXFlcvs5bOQjdz6hx96D/2Q==',
      width: 1920,
      height: 1080,
      description: 'Beautiful sunset through forest trees',
      license: 'cc0'
    },
    {
      id: 'nature_002',
      name: 'Ocean Waves',
      category: 'nature',
      tags: ['ocean', 'waves', 'water', 'blue', 'peaceful'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYAB//EAC8QAAEDAwMBBgQHAAAAAAAAAAECAwQABREGITESE1FhcYGxFCJBkQcVIzKhwdH/xAAXAQEBAQEAAAAAAAAAAAAAAAABAAID/8QAFREBAQAAAAAAAAAAAAAAAAAAAR/aAAwDAQACEQMRAD8A3CIJ6unJHAVyHMUBHfzVGC8H1R8H9QKJUwJEVz10qHIHXp9KGWgxnOF/MooJe0Hj6j7VgbEjsAI40KsdlBpGoyMFDaQeoGMcKFEyWGmmG2QhGcYznN5rqS2qQVjOzaQM5yaGXJnPNlGehxQDpGAAoOKUt1tKsjbB2pq0p1xGVJSkfaoI4a3K8LaaXn0cHO9Y6+EFz9LW2QCwQcFOOnb0qQ9k3nUOz3VtTaJUXFuEd0hQxn/B6ipB8b6KzYUWK3vrtEXKt8VfEJdtYknJbUdtuDyKE0dqQtpQ9YVMypXSUSFKaXjYFQBxWQFYBhWNJ3cQo23Pdt5dGn8SLOk2x/K27q6DncjnxANYG7PfKXQ4W5zHwMQEDfHGRS/TdxctN3jzIr6A6xnp0bEcZGfDz/tRu1PQ1bN/D6CvSqPJbXGCU3NFx6erp14GCo56dtuaqpZs3OBDsWl9QQHCi1MtLmIz+mhCiR/RzV2mKdNMJbAAJNGhDSG+hKMhOKFr5cAAVYjqUQlvPNCCLJcGhGQvJB3qtSAo4yefGjMrKnGEIwpP5nO3aqpJCpPy8J6R/lRTFuEhEaOLjGjLbeSOh1QJSsEbgpJx98Vp0L2phcVAJtdYzAAADdKdOWYu5T/AAkTR+/t8u7j2iKOh1Mu14xfBTRqgVtCEKAOxIpsw8Wni63jboq0L6iSd9H7Z3v3f//Z',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYAB//EAC8QAAEDAwMBBgQHAAAAAAAAAAECAwQABREGITESE1FhcYGxFCJBkQcVIzKhwdH/xAAXAQEBAQEAAAAAAAAAAAAAAAABAAID/8QAFREBAQAAAAAAAAAAAAAAAAAAAR/aAAwDAQACEQMRAD8A3CIJ6unJHAVyHMUBHfzVGC8H1R8H9QKJUwJEVz10qHIHXp9KGWgxnOF/MooJe0Hj6j7VgbEjsAI40KsdlBpGoyMFDaQeoGMcKFEyWGmmG2QhGcYznN5rqS2qQVjOzaQM5yaGXJnPNlGehxQDpGAAoOKUt1tKsjbB2pq0p1xGVJSkfaoI4a3K8LaaXn0cHO9Y6+EFz9LW2QCwQcFOOnb0qQ9k3nUOz3VtTaJUXFuEd0hQxn/B6ipB8b6KzYUWK3vrtEXKt8VfEJdtYknJbUdtuDyKE0dqQtpQ9YVMypXSUSFKaXjYFQBxWQFYBhWNJ3cQo23Pdt5dGn8SLOk2x/K27q6DncjnxANYG7PfKXQ4W5zHwMQEDfHGRS/TdxctN3jzIr6A6xnp0bEcZGfDz/tRu1PQ1bN/D6CvSqPJbXGCU3NFx6erp14GCo56dtuaqpZs3OBDsWl9QQHCi1MtLmIz+mhCiR/RzV2mKdNMJbAAJNGhDSG+hKMhOKFr5cAAVYjqUQlvPNCCLJcGhGQvJB3qtSAo5yefGjMrKnGEIwpP5nO3aqpJCpPy8J6R/lRTFuEhEaOLjGjLbeSOh1QJSsEbgpJx98Vp0L2phcVAJtdYzAAADdKdOWYu5T/AAkTR+/t8u7j2iKOh1Mu14xfBTRqgVtCEKAOxIpsw8Wni63jboq0L6iSd9H7Z3v3f//Z',
      width: 1920,
      height: 1080,
      description: 'Peaceful ocean waves on a sunny day',
      license: 'cc0'
    },
    
    // صور الأعمال
    {
      id: 'business_001',
      name: 'Modern Office',
      category: 'business',
      tags: ['office', 'modern', 'workspace', 'corporate', 'desk'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAABAUCAwYBB//EAC8QAAIBAwIEBAQHAQAAAAAAAAECAwAEEQUhBhJBMVFhcQcTIoEUMkKRobHB8P/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAAR/aAAwDAQACEQMRAD8A6IeHorSJYrO3it4l5VjjGAKGkUyrtYnBOQCasxgYotLfJ6uA2cd69Ipy4ntxp/iRhcMBbcQ6dZ6d4ctZhFKWtI0jn9R5jJI6oP6Z6mtLp+vW+s+NLDQ5knt72KGeSKeCFp4jgdyoB5/QgA5oo0N4J8P2Y0fS/EMs8V1rGhT3E088R3lYNlI+eDgegtgn1x3zWjs7YRSP5kn4qVpjL5z4I9Pb05ycVV4O1ybQfDOo37eVfadPqF7f3Wnyb4wskjT+I0iCr2KnGRgHp0rI+B9J034q6PdPrcUNvo4uX8yNlhh2jHOcfZ8v8qPCOhUqtdxwwkgbLsG41Xp/wA==',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAABAUCAwYBB//EAC/QAAIBAwIEBAQHAQAAAAAAAAECAwAEEQUhBhJBMVFhcQcTIoEUMkKRobHB8P/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAAR/aAAwDAQACEQMRAD8A6IeHorSJYrO3it4l5VjjGAKGkUyrtYnBOQCasxgYotLfJ6uA2cd69Ipy4ntxp/iRhcMBbcQ6d4ctZhFKWtI0jn9R5jJI6oP6Z6mtLp+vW+s+NLDQ5knt72KGeSKeCFp4jgdyoB5/QgA5oo0N4J8P2Y0fS/EMs8V1rGhT3E088R3lYNlI+eDgegtgn1x3zWjs7YRSP5kn4qVpjL5z4I9Pb05ycVV4O1ybQfDOo37eVfadPqF7f3Wnyb4wskjT+I0iCr2KnGRgHp0rI+B9J034q6PdPrcUNvo4uX8yNlhh2jHOcfZ8v8qPCOhUqtdxwwkgbLsG41Xp/wA==',
      width: 1920,
      height: 1080,
      description: 'Clean modern office workspace',
      license: 'cc0'
    },
    {
      id: 'business_002',
      name: 'Team Meeting',
      category: 'business',
      tags: ['meeting', 'team', 'collaboration', 'conference', 'business'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAHAAAAwADAQEAAAAAAAAAAAAABAUGAAEDB//EAC0QAAIBAwIFAwQCAwAAAAAAAAECAwAEEQUSBiExQWETUXEHFCKhMoEjM5H/xAAXAQEBAQEAAAAAAAAAAAAAAAABAAID/8QAFREBAQAAAAAAAAAAAAAAAAAAAR/aAAwDAQACEQMRAD8A5vq1rJYRl1YN6jbfCnpwK0W5Ceg8VZXekzXGhPqVwrB2cLAgOOgzk+59M1P+QlluSSkxLKOo6V3KjPKGE3d1+5aHB6gknIrHZopXDgfZhNnyeDWr7WL3UpDJNIxGcYGAKyFyk8UvTjG37iuEY+tEzXH2/DX0H8lLrj8jGajNP+oOv6ZMk10I9RYZ3hAFaHrySIce+aBFdcb2sNhNJrEt7cPcoZFjklJ2k/8AlOFPuW6fz6VDftxkKqgAAYAqP1KKGWVy5JyKCTtLO5uriKOCKSWSTqEXr19BQFhWz32k65qVvotsdLulvJ7dIlvtxCfVZfUDBgQSq7SenXHtm3hrhfXOELDUrKzv5VHq28kV4qJDdOJBlZlDr+QBCscd+2MGnlqoF7EZPb4W9Y7/AP/Z',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAHAAAAwADAQEAAAAAAAAAAAAABAUGAAEDB//EAC0QAAIBAwIFAwQCAwAAAAAAAAECAwAEEQUSBiExQWETUXEHFCKhMoEjM5H/xAAXAQEBAQEAAAAAAAAAAAAAAAABAAID/8QAFREBAQAAAAAAAAAAAAAAAAAAAR/aAAwDAQACEQMRAD8A5vq1rJYRl1YN6jbfCnpwK0W5Ceg8VZXekzXGhPqVwrB2cLAgOOgzk+59M1P+QlluSSkxLKOo6V3KjPKGE3d1+5aHB6gknIrHZopXDgfZhNnyeDWr7WL3UpDJNIxGcYGAKyFyk8UvTjG37iuEY+tEzXH2/DX0H8lLrj8jGajNP+oOv6ZMk10I9RYZ3hAFaHrySIce+aBFdcb2sNhNJrEt7cPcoZFjklJ2k/8AlOFPuW6fz6VDftxkKqgAAYAqP1KKGWVy5JyKCTtLO5uriKOCKSWSTqEXr19BQFhWz32k65qVvotsdLulvJ7dIlvtxCfVZfUDBgQSq7SenXHtm3hrhfXOELDUrKzv5VHq28kV4qJDdOJBlZlDr+QBCscd+2MGnlqoF7EZPb4W9Y7/AP/Z',
      width: 1920,
      height: 1080,
      description: 'Professional team meeting discussion',
      license: 'cc0'
    },
    
    // صور التقنية
    {
      id: 'tech_001',
      name: 'Laptop Code',
      category: 'technology',
      tags: ['laptop', 'code', 'programming', 'development', 'computer'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhkAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      width: 1920,
      height: 1080,
      description: 'Developer working on laptop with code',
      license: 'cc0'
    },
    {
      id: 'tech_002',
      name: 'Smartphone Apps',
      category: 'technology',
      tags: ['smartphone', 'apps', 'mobile', 'technology', 'screen'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      width: 1920,
      height: 1080,
      description: 'Modern smartphone with various apps',
      license: 'cc0'
    },
    
    // صور الأشخاص
    {
      id: 'people_001',
      name: 'Happy Group',
      category: 'people',
      tags: ['people', 'group', 'happy', 'friends', 'smiling'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      width: 1920,
      height: 1080,
      description: 'Group of happy friends celebrating',
      license: 'cc0'
    },
    {
      id: 'people_002',
      name: 'Creative Portrait',
      category: 'people',
      tags: ['portrait', 'creative', 'person', 'artistic', 'photography'],
      thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      fullUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUCAwYHAP/EAC0QAAIBAwMCBQMFAQAAAAAAAAECAwAEEQUSITFBBhNRYXEigZGhscHR8P/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABoRAQEAAwEBAAAAAAAAAAAAAAABEQISITH/2gAMAwEAAhEDEQA/AMlp1vbzandQm4jtkeFnLuo+oEAhce/NbHT9RW6tZbi4hOm2sDlI1U/U2BnAx6c49fGhde8G3Dazd6raeZb+Y5lhVhgAhQNp/IOhqc0/g+TTmjvNVaawtJpjDHHgM5Gfr+7HGODhif4xUdF3iLUbHXLG3n0tJYJrZm8qUPzGSMZGOSO+agIJPCNvaW02ohU1l5lgZYpDFJGFJy+49fTP61S6j4Y1ixmjtkl+03EhCR3i7m3H1w3/ABQs0vhm5utLTUbyG30x7kQrG7qVA9OavY4eJZde8O6oYbMSXEqeZFGowrSLngL/ALyMCuaX0n3JdCwHPyrjnPtz3raatpyX1uYNK1/TZL5yrSSyNtUbedynGfes7bWkmQz49Oev6Cjg+fqHyLNyD8U3bTpBa24LqCykgADmr08M3L28tyNhiwT5ZJyEPII780wRSxA0MrMTwB3oLRo7Cy8T6dLJGkqCVSxXOBk4NK9D+L+f3/ao1fV9Lt9PlsFj1gPqHn20/m4PztGMAfpU6xXRf//Z',
      width: 1920,
      height: 1080,
      description: 'Artistic portrait photography with creative lighting',
      license: 'cc0'
    }
  ];

  constructor() {
    console.log('Local Image Library initialized with', this.images.length, 'images');
  }

  /**
   * البحث في المكتبة المحلية
   */
  async search(query: string = '', category?: string, limit: number = 20): Promise<ImageSearchResult> {
    try {
      let results = [...this.images];

      // تطبيق فلتر الفئة
      if (category) {
        results = results.filter(img => img.category === category);
      }

      // تطبيق البحث النصي
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        results = results.filter(img => 
          img.name.toLowerCase().includes(searchTerm) ||
          img.description.toLowerCase().includes(searchTerm) ||
          img.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // تحديد النتائج حسب الحد الأقصى
      const paginatedResults = results.slice(0, limit);

      return {
        items: paginatedResults,
        total: results.length,
        hasMore: results.length > limit
      };
    } catch (error) {
      console.error('Local image search failed:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  /**
   * الحصول على صورة بالمعرف
   */
  async getById(id: string): Promise<LocalImage | null> {
    try {
      const image = this.images.find(img => img.id === id);
      return image || null;
    } catch (error) {
      console.error('Failed to get image by ID:', error);
      return null;
    }
  }

  /**
   * الحصول على جميع الفئات المتاحة
   */
  getCategories(): string[] {
    const categories = [...new Set(this.images.map(img => img.category))];
    return categories.sort();
  }

  /**
   * الحصول على صور شائعة
   */
  async getPopular(limit: number = 10): Promise<LocalImage[]> {
    // إرجاع أول صور من كل فئة
    const categories = this.getCategories();
    const popular: LocalImage[] = [];
    
    categories.forEach(category => {
      const categoryImages = this.images.filter(img => img.category === category);
      if (categoryImages.length > 0) {
        popular.push(categoryImages[0]);
      }
    });

    return popular.slice(0, limit);
  }

  /**
   * محاكاة تحميل الصورة (في التطبيق الحقيقي، ستكون الصور محلية)
   */
  async download(image: LocalImage, quality: 'low' | 'high' = 'high'): Promise<string> {
    try {
      // في التطبيق الحقيقي، الصور ستكون محفوظة محلياً
      // هنا نحن نرجع الرابط المباشر
      const url = quality === 'high' ? image.fullUrl : image.thumbnailUrl;
      
      // محاكاة وقت التحميل
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return url;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }

  /**
   * إضافة صورة جديدة للمكتبة (للمحتوى المخصص)
   */
  addImage(image: Omit<LocalImage, 'id'>): LocalImage {
    const newImage: LocalImage = {
      ...image,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.images.push(newImage);
    console.log('Added new image to library:', newImage.id);
    
    return newImage;
  }

  /**
   * إحصائيات المكتبة
   */
  getStats() {
    const categories = this.getCategories();
    const stats = {
      totalImages: this.images.length,
      categories: categories.length,
      categoryBreakdown: categories.map(category => ({
        category,
        count: this.images.filter(img => img.category === category).length
      }))
    };

    return stats;
  }
}

export default LocalImageLibrary;