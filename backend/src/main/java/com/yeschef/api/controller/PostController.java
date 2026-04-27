package com.yeschef.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.yeschef.api.DTO.PostRequestDTO;
import com.yeschef.api.DTO.PostResponseDTO;
import com.yeschef.api.model.Post;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.repository.PostRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.DTO.RecipeResponseDTO;
import com.yeschef.api.DTO.RecipeRequestDTO;
import com.yeschef.api.model.Instruct;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.RecipeSourceRepository;
import com.yeschef.api.service.SupabaseStorageService;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;



import java.util.List;
import java.util.stream.Collectors;

// This controller exposes REST endpoints related to posts
@RestController
@RequestMapping("/posts")
@CrossOrigin(origins = "*")
public class PostController {

    private static final Logger log = LoggerFactory.getLogger(PostController.class);
    private final SupabaseStorageService storageService;
    private final RecipeRepository recipeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final RecipeSourceRepository sourceRepository;
    

    public PostController(
        PostRepository postRepository,
        RecipeRepository recipeRepository,
        RecipeSourceRepository sourceRepository,
        UserRepository userRepository,
        SupabaseStorageService storageService) {
        this.postRepository = postRepository;
        this.recipeRepository = recipeRepository;
        this.sourceRepository = sourceRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<PostResponseDTO>> getAllPosts() {
        return ResponseEntity.ok(
            postRepository.findAll()
                .stream()
                .map(this::toPostDTO)
                .toList()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDTO> getPost(@PathVariable Long id) {
        return postRepository.findById(id)
            .map(post -> ResponseEntity.ok(toPostDTO(post)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET BY RECIPE ID
    @GetMapping("/by-recipe/{recipeId}")
    public ResponseEntity<PostResponseDTO> getPostByRecipeId(@PathVariable Long recipeId) {
        return postRepository.findByRecipeId(recipeId)
            .map(post -> ResponseEntity.ok(toPostDTO(post)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET BY NAME
    @GetMapping("/by-name")
    public ResponseEntity<List<PostResponseDTO>> getByName(@RequestParam String name) {
        return ResponseEntity.ok(
            postRepository.findByRecipe_TitleContainingIgnoreCase(name)
                .stream()
                .map(this::toPostDTO)
                .toList()
        );
    }

    // GET BY INGREDIENT
    @GetMapping("/by-ingredient")
    public ResponseEntity<List<PostResponseDTO>> getByIngredient(@RequestParam String ingredient) {
        return ResponseEntity.ok(
            postRepository.findByRecipe_Ingredients_IngredientIgnoreCase(ingredient)
                .stream()
                .map(this::toPostDTO)
                .toList()
        );
    }

    // GET BY TIME
    @GetMapping("/by-time")
    public ResponseEntity<List<PostResponseDTO>> getByTime(@RequestParam String maxTime) {
        int time = Integer.parseInt(maxTime);

        return ResponseEntity.ok(
            postRepository.findByTotalTimeLessThanEqual(time)
                .stream()
                .map(this::toPostDTO)
                .toList()
        );
    }

    // POST CREATE
    @PostMapping
    public ResponseEntity<PostResponseDTO> createPost(@RequestBody PostRequestDTO dto) {

        RecipeRequestDTO recipeDTO = dto.getRecipe();

        Recipe recipe = recipeRepository.findByTitleIgnoreCase(recipeDTO.getTitle())
            .orElseGet(() -> {
                Recipe newRecipe = toEntity(recipeDTO);

                if (recipeDTO.getUserId() != null) {
                    User user = userRepository.findById(recipeDTO.getUserId())
                        .orElseThrow();
                    newRecipe.getSource().setUser(user);
                }

                return recipeRepository.save(newRecipe);
            });

        if (postRepository.findByRecipeId(recipe.getId()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        Post post = new Post();
        post.setRecipe(recipe);

        if (dto.getImage() != null && !dto.getImage().isBlank()) {
            post.setImage(dto.getImage());
        }
        if (dto.getNotes() != null) {
            post.setNotes(dto.getNotes());
        }

        return ResponseEntity.ok(toPostDTO(postRepository.save(post)));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<PostResponseDTO> updatePost(
        @PathVariable Long id,
        @RequestBody PostRequestDTO dto
    ) {
        return postRepository.findById(id)
            .map(post -> {
                if (dto.getImage() != null) {
                    post.setImage(dto.getImage());
                }
                if (dto.getNotes() != null) {
                    post.setNotes(dto.getNotes());
                }
                return ResponseEntity.ok(toPostDTO(postRepository.save(post)));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = storageService.uploadImage(file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            log.error("Image upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    // GET FRIENDS FEED
    @GetMapping("/friends/{userId}")
    public ResponseEntity<List<PostResponseDTO>> getFriendsFeed(@PathVariable Long userId) {
        return ResponseEntity.ok(
            postRepository.findByFriendsOf(userId)
                .stream()
                .map(this::toFeedPostDTO)
                .toList()
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        postRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // DTO MAPPERS
    private PostResponseDTO toFeedPostDTO(Post post) {
        Recipe recipe = post.getRecipe();
        RecipeResponseDTO recipeDTO = new RecipeResponseDTO(
            recipe.getId(),
            recipe.getTitle(),
            recipe.getSource().getSourceType().toString(),
            recipe.getInstruction().getPrepTime(),
            recipe.getInstruction().getCookTime(),
            List.of(),
            List.of()
        );
        User creator = recipe.getSource().getUser();
        if (creator != null) {
            recipeDTO.setUserId(creator.getId());
            recipeDTO.setUsername(creator.getUsername());
        }
        return new PostResponseDTO(post.getId(), post.getImage(), post.getNotes(), recipeDTO);
    }

    private PostResponseDTO toPostDTO(Post post) {
        return new PostResponseDTO(
            post.getId(),
            post.getImage(),
            post.getNotes(),
            toDTO(post.getRecipe())
        );
    }

    private RecipeResponseDTO toDTO(Recipe recipe) {
        return new RecipeResponseDTO(
            recipe.getId(),
            recipe.getTitle(),
            recipe.getSource().getSourceType().toString(),
            recipe.getInstruction().getPrepTime(),
            recipe.getInstruction().getCookTime(),
            List.of(),
            List.of()
        );
    }

    private Recipe toEntity(RecipeRequestDTO dto) {
        Recipe recipe = new Recipe();
        recipe.setTitle(dto.getTitle());

        RecipeSource source = new RecipeSource();
        source.setSourceTypeFromString(dto.getSourceType());
        source = sourceRepository.save(source);

        recipe.setSource(source);

        List<Recipe.Ingredient> ingredients = dto.getIngredients() == null
            ? List.of()
            : dto.getIngredients().stream()
                .map(i -> new Recipe.Ingredient(i.getIngredient(), i.getQuantity()))
                .collect(Collectors.toList());
        recipe.setIngredients(ingredients);

        Instruct instruct = new Instruct();
        instruct.setPrepTime(dto.getPrepTime());
        instruct.setCookTime(dto.getCookTime());
        instruct.setRecipe(recipe);

        List<Instruct.InstructionStep> steps = dto.getSteps() == null
            ? List.of()
            : dto.getSteps().stream()
                .map(s -> new Instruct.InstructionStep(s.getStepNumber(), s.getStepDescription()))
                .collect(Collectors.toList());
        instruct.setSteps(steps);

        recipe.setInstruction(instruct);

        return recipe;
    }
}