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

// This controller exposes REST endpoints related to posts
@RestController
@RequestMapping("/posts")
@CrossOrigin(origins = "*")
public class PostController {

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
            postRepository.findByRecipe_Instruction_PrepTimePlusCookTimeLessThanEqual(time)
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
            return ResponseEntity.internalServerError().build();
        }
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

    // DTO MAPPER
    private PostResponseDTO toPostDTO(Post post) {
        return new PostResponseDTO(
            post.getId(),
            post.getImage(),
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

        Instruct instruct = new Instruct();
        instruct.setPrepTime(dto.getPrepTime());
        instruct.setCookTime(dto.getCookTime());
        instruct.setRecipe(recipe);

        recipe.setInstruction(instruct);

        return recipe;
    }
}